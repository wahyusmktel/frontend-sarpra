<script setup>
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const token = localStorage.getItem('token');
const API_BASE = 'http://localhost:8000/api';

const assets = ref([]);
const selectedAsset = ref(null);
const documents = ref([]);
const selectedFile = ref(null);
const loading = ref(false);
const documentType = ref('');
const previewUrl = ref(null);
const previewVisible = ref(false);

onMounted(() => {
    fetchAssets();
});

function onFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        selectedFile.value = file;
    }
}

function previewDocument(url) {
    previewUrl.value = url;
    previewVisible.value = true;
}

async function fetchAssets() {
    try {
        const res = await axios.get(`${API_BASE}/assets`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        assets.value = res.data.data ?? res.data;
    } catch (err) {
        console.error('Gagal ambil aset:', err);
    }
}

async function fetchDocuments(assetId) {
    loading.value = true;
    try {
        const res = await axios.get(`${API_BASE}/assets/${assetId}/documents`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        documents.value = res.data.data ?? res.data;
    } catch (err) {
        console.error('Gagal ambil dokumen:', err);
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Tidak bisa memuat dokumen' });
    } finally {
        loading.value = false;
    }
}

async function handleUpload() {
    if (!selectedAsset.value || !selectedFile.value) return;

    // Validasi format dan ukuran file
    const allowedTypes = ['application/pdf', 'application/zip'];
    if (!allowedTypes.includes(selectedFile.value.type)) {
        return toast.add({ severity: 'warn', summary: 'Gagal', detail: 'Hanya file PDF atau ZIP yang diizinkan' });
    }
    if (selectedFile.value.size > 5 * 1024 * 1024) {
        return toast.add({ severity: 'warn', summary: 'Gagal', detail: 'Ukuran maksimal 5MB' });
    }

    const formData = new FormData();
    formData.append('asset_id', selectedAsset.value);
    formData.append('document_type', documentType.value);
    formData.append('file', selectedFile.value);

    try {
        await axios.post(`${API_BASE}/assets/documents`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Dokumen berhasil diunggah' });
        fetchDocuments(selectedAsset.value);
        selectedFile.value = null;
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Upload gagal' });
    }
}

async function deleteDocument(docId) {
    try {
        await axios.delete(`${API_BASE}/assets/documents/${docId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.add({ severity: 'success', summary: 'Dihapus', detail: 'Dokumen berhasil dihapus' });
        fetchDocuments(selectedAsset.value);
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal hapus dokumen' });
    }
}
</script>

<template>
    <div class="card">
        <h4 class="mb-4">Manajemen Dokumen Aset</h4>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
                <label class="block font-bold mb-2">Pilih Aset</label>
                <Dropdown v-model="selectedAsset" :options="assets" optionLabel="name" optionValue="id" placeholder="Pilih Aset" class="w-full" @change="fetchDocuments(selectedAsset)" />
            </div>

            <div>
                <label class="block font-bold mb-2">Jenis Dokumen</label>
                <Dropdown v-model="documentType" :options="['Manual', 'Invoice', 'Warranty', 'Other']" placeholder="Jenis Dokumen" class="w-full mb-3" />
            </div>

            <div>
                <label class="block font-bold mb-2">Unggah Dokumen</label>
                <input type="file" class="p-inputtext mb-2" @change="onFileSelect" />
                <div v-if="selectedFile" class="text-sm text-gray-500 mb-2">File dipilih: {{ selectedFile.name }}</div>
                <Button label="Upload" icon="pi pi-upload" @click="handleUpload" :disabled="!selectedFile || !selectedAsset" />
            </div>
        </div>

        <div v-if="loading" class="mb-4">
            <Skeleton width="100%" height="2rem" class="mb-2" v-for="i in 3" :key="i" />
        </div>

        <DataTable v-else :value="documents" :paginator="true" :rows="5">
            <Column field="file_name" header="Nama File"></Column>
            <Column field="document_type" header="Tipe Dokumen"></Column>
            <Column header="Tanggal Upload">
                <template #body="slotProps">
                    {{ slotProps.data.uploaded_at || '-' }}
                </template>
            </Column>
            <Column header="Aksi">
                <template #body="slotProps">
                    <Button icon="pi pi-eye" text rounded @click="previewDocument(slotProps.data.url)" />
                    <Button icon="pi pi-trash" text rounded severity="danger" @click="deleteDocument(slotProps.data.id)" />
                </template>
            </Column>
        </DataTable>
        <Dialog v-model:visible="previewVisible" :style="{ width: '80vw', height: '80vh' }" header="Preview Dokumen" :modal="true">
            <div class="h-[70vh]">
                <iframe v-if="previewUrl" :src="previewUrl" class="w-full h-full border" frameborder="0"> Browser kamu tidak mendukung preview dokumen. </iframe>
            </div>
        </Dialog>
    </div>
</template>
