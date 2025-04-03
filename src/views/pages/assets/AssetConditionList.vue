<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();

const loading = ref(true);
const conditions = ref([]);
const condition = ref({});
const conditionDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const selectedConditions = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const token = localStorage.getItem('token');
const API_URL = 'http://localhost:8000/api/asset-conditions';

onMounted(async () => {
    await fetchConditions();
    loading.value = false;
});

async function fetchConditions() {
    try {
        const res = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        conditions.value = res.data.data ?? res.data;
    } catch (error) {
        console.error('Error fetching asset conditions:', error);
    }
}

function openNew() {
    condition.value = {};
    submitted.value = false;
    conditionDialog.value = true;
}

function editCondition(data) {
    condition.value = { ...data };
    submitted.value = false;
    conditionDialog.value = true;
}

function hideDialog() {
    conditionDialog.value = false;
    submitted.value = false;
}

async function saveCondition() {
    submitted.value = true;
    if (!condition.value.name) return;

    try {
        if (condition.value.id) {
            await axios.put(`${API_URL}/${condition.value.id}`, condition.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kondisi diperbarui', life: 3000 });
        } else {
            await axios.post(API_URL, condition.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kondisi ditambahkan', life: 3000 });
        }

        await fetchConditions();
        conditionDialog.value = false;
        condition.value = {};
    } catch (error) {
        console.error('Save error:', error);
    }
}

function confirmDelete(data) {
    condition.value = data;
    deleteDialog.value = true;
}

async function deleteCondition() {
    try {
        await axios.delete(`${API_URL}/${condition.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        await fetchConditions();
        deleteDialog.value = false;
        toast.add({ severity: 'success', summary: 'Dihapus', detail: 'Kondisi aset dihapus', life: 3000 });
    } catch (error) {
        console.error('Delete error:', error);
    }
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <div class="card">
        <template v-if="loading">
            <Skeleton height="2rem" class="mb-2" v-for="n in 5" :key="n" />
        </template>
        <template v-else>
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Tambah" icon="pi pi-plus" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="info" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="conditions"
                v-model:selection="selectedConditions"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} hingga {last} dari {totalRecords} kondisi"
            >
                <template #header>
                    <div class="flex justify-between items-center">
                        <h4 class="m-0">Manajemen Kondisi Aset</h4>
                        <InputText v-model="filters['global'].value" placeholder="Cari kondisi..." />
                    </div>
                </template>

                <Column field="name" header="Nama Kondisi" sortable />
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editCondition(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </template>

        <!-- Form Modal -->
        <Dialog v-model:visible="conditionDialog" :style="{ width: '450px' }" header="Form Kondisi Aset" :modal="true">
            <div class="flex flex-col gap-4">
                <label for="name" class="font-bold mb-1">Nama Kondisi</label>
                <InputText id="name" v-model="condition.name" autofocus :invalid="submitted && !condition.name" />
                <small v-if="submitted && !condition.name" class="text-red-500">Nama kondisi wajib diisi</small>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveCondition" />
            </template>
        </Dialog>

        <!-- Hapus Modal -->
        <Dialog v-model:visible="deleteDialog" header="Konfirmasi" :modal="true" :style="{ width: '400px' }">
            <div class="flex align-items-center gap-4">
                <i class="pi pi-exclamation-triangle text-xl text-red-500" />
                <span
                    >Yakin ingin hapus kondisi <b>{{ condition.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Ya" icon="pi pi-check" severity="danger" @click="deleteCondition" />
            </template>
        </Dialog>
    </div>
</template>
