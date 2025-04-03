<script setup>
import axios from 'axios';
import Card from 'primevue/card';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const asset = ref({});
const token = localStorage.getItem('token');

onMounted(fetchAsset);

async function fetchAsset() {
    try {
        const res = await axios.get(`http://localhost:8000/api/assets/${route.params.id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        asset.value = res.data;
    } catch (err) {
        console.error('Gagal ambil detail aset:', err);
    }
}
</script>

<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold mb-4">Detail Aset</h1>

        <Card>
            <template #title>{{ asset?.name }}</template>
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                    <div><strong>Serial Number:</strong> {{ asset.serial_number }}</div>
                    <div><strong>Kategori:</strong> {{ asset.category?.name }}</div>
                    <div><strong>Kondisi:</strong> {{ asset.condition?.name }}</div>
                    <div><strong>Lokasi:</strong> {{ asset.location?.name }}</div>
                    <div><strong>Tanggal Perolehan:</strong> {{ asset.acquisition_date }}</div>
                    <div><strong>Sumber Dana:</strong> {{ asset.funding_source }}</div>
                    <div><strong>Penanggung Jawab:</strong> {{ asset.responsible?.full_name ?? 'Belum ditentukan' }}</div>
                </div>
            </template>
        </Card>
    </div>
</template>
