<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const dt = ref();
const toast = useToast();

const assetTypes = ref([]);
const assetType = ref({});
const selectedAssetTypes = ref();
const assetTypeDialog = ref(false);
const deleteAssetTypeDialog = ref(false);
const deleteAssetTypesDialog = ref(false);
const submitted = ref(false);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const token = localStorage.getItem('token');
const API_URL = 'http://localhost:8000/api/asset-types';

onMounted(() => {
    fetchAssetTypes();
});

async function fetchAssetTypes() {
    loading.value = true;
    try {
        const res = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        assetTypes.value = res.data.data ?? res.data;
    } catch (err) {
        console.error('Gagal ambil jenis aset:', err);
    } finally {
        loading.value = false;
    }
}

function openNew() {
    assetType.value = {};
    submitted.value = false;
    assetTypeDialog.value = true;
}

function hideDialog() {
    assetTypeDialog.value = false;
    submitted.value = false;
}

function editAssetType(data) {
    assetType.value = { ...data };
    assetTypeDialog.value = true;
}

function confirmDeleteAssetType(data) {
    assetType.value = data;
    deleteAssetTypeDialog.value = true;
}

function confirmDeleteSelected() {
    deleteAssetTypesDialog.value = true;
}

async function saveAssetType() {
    submitted.value = true;
    if (!assetType.value.name) return;

    try {
        if (assetType.value.id) {
            await axios.put(`${API_URL}/${assetType.value.id}`, assetType.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'Jenis aset diperbarui', life: 3000 });
        } else {
            await axios.post(API_URL, assetType.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'Jenis aset ditambahkan', life: 3000 });
        }

        fetchAssetTypes();
        assetTypeDialog.value = false;
        assetType.value = {};
    } catch (error) {
        console.error('Gagal simpan:', error);
    }
}

async function deleteAssetType() {
    try {
        await axios.delete(`${API_URL}/${assetType.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchAssetTypes();
        deleteAssetTypeDialog.value = false;
        toast.add({ severity: 'success', summary: 'Dihapus', detail: 'Jenis aset dihapus', life: 3000 });
    } catch (error) {
        console.error('Gagal hapus:', error);
    }
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <div class="card">
        <template v-if="loading">
            <Skeleton height="2rem" class="mb-3" v-for="n in 5" :key="n" />
        </template>

        <template v-else>
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah" icon="pi pi-plus" class="mr-2" @click="openNew" />
                    <Button label="Hapus" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedAssetTypes?.length" />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable ref="dt" :value="assetTypes" v-model:selection="selectedAssetTypes" dataKey="id" :paginator="true" :rows="10" :filters="filters" currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords}">
                <template #header>
                    <div class="flex justify-between">
                        <h4 class="m-0">Manajemen Jenis Aset</h4>
                        <InputText v-model="filters['global'].value" placeholder="Cari..." />
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" />
                <Column field="name" header="Nama Jenis" sortable />
                <Column :exportable="false" style="min-width: 8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" rounded outlined class="mr-2" @click="editAssetType(slotProps.data)" />
                        <Button icon="pi pi-trash" rounded outlined severity="danger" @click="confirmDeleteAssetType(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </template>

        <!-- Dialog Form -->
        <Dialog v-model:visible="assetTypeDialog" :style="{ width: '450px' }" header="Form Jenis Aset" :modal="true">
            <div class="flex flex-col gap-4">
                <label for="name" class="font-semibold">Nama Jenis</label>
                <InputText id="name" v-model="assetType.name" required :invalid="submitted && !assetType.name" class="w-full" autofocus />
                <small v-if="submitted && !assetType.name" class="text-red-500">Nama jenis wajib diisi</small>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveAssetType" />
            </template>
        </Dialog>

        <!-- Dialog Konfirmasi Hapus -->
        <Dialog v-model:visible="deleteAssetTypeDialog" :style="{ width: '450px' }" header="Konfirmasi" :modal="true">
            <div class="flex align-items-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span
                    >Yakin ingin hapus <b>{{ assetType.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteAssetTypeDialog = false" />
                <Button label="Ya" icon="pi pi-check" severity="danger" @click="deleteAssetType" />
            </template>
        </Dialog>
    </div>
</template>
