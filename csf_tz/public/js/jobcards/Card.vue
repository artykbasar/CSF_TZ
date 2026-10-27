<script setup>
import { useJobCard } from "./useJobCard.js";

const props = defineProps({
    jobCard: { type: Object, required: true },
});
const emit = defineEmits(["close", "saved"]);
const {
    card, members, completedQty, busy, elapsedSeconds, search,
    visibleEmployees, close, startJob, pauseJob, submitJob, timeLabel,
} = useJobCard(props, emit);
</script>

<template>
    <div class="modal show d-block" role="dialog" aria-modal="true" aria-label="Job Card details">
        <div class="modal-dialog modal-lg" role="document" style="max-width: 920px">
            <div class="modal-content">
                <div class="modal-header align-items-center">
                    <h4 class="modal-title">{{ card?.operation?.name || props.jobCard.name }}</h4>
                    <span v-if="card" class="font-weight-bold" aria-label="Elapsed time">
                        {{ timeLabel(elapsedSeconds) }}
                    </span>
                    <button type="button" class="close" aria-label="Close" @click="close">×</button>
                </div>
                <div v-if="!card" class="modal-body" role="status">Loading Job Card…</div>
                <template v-else>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Job Card:</strong> {{ card.name }}</p>
                                <p><strong>Status:</strong> {{ card.status }}</p>
                                <p><strong>Production Item:</strong> {{ card.production_item }}</p>
                            </div>
                            <div class="col-md-6">
                                <label class="control-label" for="csf-job-description">Operation Description</label>
                                <textarea id="csf-job-description" class="form-control" rows="3"
                                    :value="card.operation?.description || ''" readonly></textarea>
                            </div>
                        </div>
                        <div class="form-group mt-3">
                            <label class="control-label" for="csf-employee-search">Find Employee</label>
                            <input id="csf-employee-search" v-model="search" class="form-control"
                                type="search" autocomplete="off" placeholder="Filter employee list" />
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <label class="control-label" for="csf-job-leader">Team Leader</label>
                                <select id="csf-job-leader" v-model="card.employee" class="form-control"
                                    :disabled="!!card.employee || busy">
                                    <option value="">Select an employee</option>
                                    <option v-for="person in visibleEmployees" :key="person.name"
                                        :value="person.name">{{ person.name }} — {{ person.employee_name }}</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="control-label" for="csf-job-members">Station Members</label>
                                <select id="csf-job-members" v-model="members" class="form-control"
                                    multiple size="4" :disabled="busy">
                                    <option v-for="person in visibleEmployees" :key="person.name"
                                        :value="person.name">{{ person.name }} — {{ person.employee_name }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group mt-3">
                            <label class="control-label" for="csf-job-remarks">Remarks</label>
                            <textarea id="csf-job-remarks" v-model="card.remarks" class="form-control"
                                rows="2" :disabled="busy"></textarea>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span><strong>Qty To Manufacture:</strong> {{ card.for_quantity }}</span>
                            <span><strong>Qty Completed:</strong> {{ card.total_completed_qty }}</span>
                        </div>
                    </div>
                    <div class="modal-footer d-flex flex-wrap">
                        <button v-if="!card.job_started && card.total_completed_qty != card.for_quantity"
                            type="button" class="btn btn-success" :disabled="busy"
                            @click="startJob(false)">Start</button>
                        <button v-if="card.status === 'On Hold' && card.total_completed_qty != card.for_quantity"
                            type="button" class="btn btn-warning" :disabled="busy"
                            @click="startJob(true)">Resume</button>
                        <button v-if="card.status === 'Work In Progress' && card.total_completed_qty != card.for_quantity"
                            type="button" class="btn btn-warning" :disabled="busy"
                            @click="pauseJob">Stop</button>
                        <label v-if="card.status === 'Work In Progress' && card.total_completed_qty != card.for_quantity"
                            for="csf-job-completed" class="d-inline-flex align-items-center">
                            Completed Qty <input id="csf-job-completed" v-model.number="completedQty"
                                class="form-control ml-2" type="number" min="0"
                                style="max-width: 100px" :disabled="busy" />
                        </label>
                        <button v-if="card.total_completed_qty == card.for_quantity && card.status !== 'Completed'"
                            type="button" class="btn btn-primary" :disabled="busy"
                            @click="submitJob">Submit</button>
                        <button type="button" class="btn btn-default" @click="close">Close</button>
                    </div>
                </template>
            </div>
        </div>
    </div>
    <div class="modal-backdrop show" aria-hidden="true"></div>
</template>
