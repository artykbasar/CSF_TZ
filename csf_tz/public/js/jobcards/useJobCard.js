import { computed, onUnmounted, ref, shallowRef, watch } from "vue";

export function useJobCard(props, emit) {
    const card = ref(null);
    const employees = ref([]);
    const members = ref([]);
    const completedQty = shallowRef(1);
    const busy = shallowRef(false);
    const elapsedSeconds = shallowRef(0);
    const search = shallowRef("");
    let clock = null;

    const visibleEmployees = computed(() => {
        const term = search.value.trim().toLowerCase();
        return employees.value.filter((employee) =>
            !term || [employee.name, employee.employee_name].some((part) =>
                String(part || "").toLowerCase().includes(term))
        );
    });

    function secondsBetween(from, until) {
        return Math.max(0, moment(until).diff(moment(from), "seconds") || 0);
    }

    function stopClock() {
        if (clock) clearInterval(clock);
        clock = null;
    }

    function startClock() {
        stopClock();
        if (!card.value) return;
        const previous = Number(card.value.current_time) || 0;
        const running = card.value.status === "Work In Progress" && card.value.started_time;
        const update = () => {
            elapsedSeconds.value = previous +
                (running ? secondsBetween(card.value.started_time, frappe.datetime.now_datetime()) : 0);
        };
        update();
        if (running) clock = setInterval(update, 1000);
    }

    function loadCard() {
        frappe.call({
            method: "frappe.client.get",
            args: { doctype: "Job Card", name: props.jobCard.name },
            callback(r) {
                if (!r.message || r.message.name !== props.jobCard.name) return;
                card.value = { ...r.message, operation: props.jobCard.operation };
                members.value = (r.message.members || []).map((row) => row.employee);
                startClock();
                frappe.call({
                    method: "csf_tz.csf_tz.page.jobcards.jobcards.get_employees",
                    args: { company: card.value.company },
                    callback(response) {
                        if (Array.isArray(response.message)) employees.value = response.message;
                    },
                });
            },
        });
    }

    function close() {
        stopClock();
        emit("close");
    }

    function save(action = "Save", closeAfter = false) {
        if (!card.value || busy.value) return;
        busy.value = true;
        const doc = { ...card.value };
        doc.members = members.value.map((employee) => ({
            employee,
            employee_name: employees.value.find((person) => person.name === employee)?.employee_name || "",
        }));
        delete doc.operation;
        frappe.call({
            method: "csf_tz.csf_tz.page.jobcards.jobcards.save_doc",
            args: { doc: JSON.stringify(doc), action },
            callback(response) {
                busy.value = false;
                if (!response.message) return;
                card.value = { ...response.message, operation: props.jobCard.operation };
                members.value = (response.message.members || []).map((row) => row.employee);
                startClock();
                emit("saved");
                if (closeAfter) close();
            },
            error() { busy.value = false; },
        });
    }

    function startJob(resume = false) {
        if (!card.value || busy.value) return;
        if (!card.value.employee) {
            frappe.msgprint(__("Please set Employee"));
            return;
        }
        const row = frappe.model.add_child(card.value, "Job Card Time Log", "time_logs");
        row.from_time = frappe.datetime.now_datetime();
        row.name = "";
        row.completed_qty = 1;
        card.value.job_started = 1;
        card.value.started_time = row.from_time;
        card.value.status = "Work In Progress";
        frappe.flags.resume_job = resume ? 1 : 0;
        if (!resume) card.value.current_time = 0;
        startClock();
        save();
    }

    function pauseJob() {
        if (!card.value || busy.value) return;
        const quantity = flt(completedQty.value);
        if (quantity < 0 || Number(card.value.for_quantity) <
            Number(card.value.total_completed_qty) + quantity) {
            frappe.msgprint(__("The completed quantity cannot be greater than the required quantity"));
            return;
        }
        const active = [...(card.value.time_logs || [])].reverse()
            .find((row) => row.from_time && !row.to_time);
        if (!active) {
            frappe.msgprint(__("No active Job Card time log found"));
            return;
        }
        frappe.flags.pause_job = 1;
        active.completed_qty = quantity;
        active.to_time = frappe.datetime.now_datetime();
        card.value.current_time = (Number(card.value.current_time) || 0) +
            secondsBetween(active.from_time, active.to_time);
        card.value.status = "On Hold";
        completedQty.value = 1;
        stopClock();
        save();
    }

    function submitJob() {
        if (!card.value || busy.value) return;
        card.value.status = "Completed";
        save("Submit", true);
    }

    function timeLabel(value) {
        const n = Math.max(0, Math.floor(Number(value) || 0));
        return [Math.floor(n / 3600), Math.floor(n % 3600 / 60), n % 60]
            .map((part) => String(part).padStart(2, "0")).join(":");
    }

    watch(() => props.jobCard.name, loadCard, { immediate: true });
    onUnmounted(stopClock);
    return {
        card, employees, members, completedQty, busy, elapsedSeconds, search,
        visibleEmployees, close, startJob, pauseJob, submitJob, timeLabel,
    };
}
