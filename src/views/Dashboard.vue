<script setup>
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import axios from 'axios';
import { onMounted, ref } from 'vue';

const stats = ref(null);

onMounted(async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/api/asset-statistics', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        stats.value = res.data;
    } catch (err) {
        console.error('Gagal ambil statistik:', err);
    }
});
</script>

<template>
    <div class="p-8">
        <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
        <StatsWidget v-if="stats" :data="stats" />
    </div>
</template>
