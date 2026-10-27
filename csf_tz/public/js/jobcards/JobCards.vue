<script setup>
import { onMounted, ref, shallowRef } from "vue";
import Card from "./Card.vue";

const cards = ref([]);
const selected = shallowRef(null);
const loading = shallowRef(false);

function getData() {
    loading.value = true;
    frappe.call({
        method: "csf_tz.csf_tz.page.jobcards.jobcards.get_job_cards",
        args: {},
        callback(response) {
            loading.value = false;
            if (Array.isArray(response.message)) {
                cards.value = response.message;
            }
        },
        error() {
            loading.value = false;
        },
    });
}

function elapsed(seconds) {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    return [Math.floor(value / 3600), Math.floor((value % 3600) / 60), value % 60]
        .map((part) => String(part).padStart(2, "0"))
        .join(":");
}

const statusColors = {
    Open: "#845ec2",
    "Work In Progress": "#2c995a",
    "Material Transferred": "#0d827f",
    "On Hold": "#607d8b",
    Submitted: "#ff5722",
};

function statusBorder(status) {
    return { borderLeft: "5px solid " + (statusColors[status] || "#87909a") };
}

onMounted(getData);
</script>

<template>
    <section class="container-fluid py-3" aria-label="Working Job Cards">
        <div class="d-flex align-items-center justify-content-between mb-3">
            <h3 class="m-0">Working Job Cards</h3>
            <button type="button" class="btn btn-default btn-sm" :disabled="loading" @click="getData">
                Refresh
            </button>
        </div>
        <p v-if="loading" role="status">Loading Job Cards…</p>
        <p v-else-if="cards.length === 0" role="status">No active Job Cards found.</p>
        <div v-for="item in cards" :key="item.name" class="card mb-3" :style="statusBorder(item.status)">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-9">
                        <small>{{ item.name }}</small>
                        <h4 class="mb-2">{{ item.operation?.name || item.name }}</h4>
                        <p class="mb-1">Qty To Manufacture: {{ item.for_quantity }}</p>
                        <p class="mb-1">Total Completed Qty: {{ item.total_completed_qty }}</p>
                        <p class="mb-1">Production Item: {{ item.production_item }}</p>
                        <p class="mb-1">Status: {{ item.status }}</p>
                        <p v-if="item.current_time" class="mb-0">Current Time: {{ elapsed(item.current_time) }}</p>
                    </div>
                    <div class="col-md-3">
                        <img
                            v-if="item.operation?.image"
                            :src="item.operation.image"
                            :alt="item.operation.name || 'Operation image'"
                            class="img-fluid rounded"
                            style="max-height: 150px; object-fit: contain"
                        />
                    </div>
                </div>
                <button type="button" class="btn btn-primary btn-sm mt-2" @click="selected = item">
                    Open
                </button>
            </div>
        </div>
        <Card
            v-if="selected"
            :key="selected.name"
            :job-card="selected"
            @close="selected = null"
            @saved="getData"
        />
    </section>
</template>
