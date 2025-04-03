<script setup>
defineProps({
    data: Object
});
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-surface-800 rounded-lg p-5 shadow">
            <h3 class="text-lg font-bold">Total Aset</h3>
            <p class="text-4xl text-primary font-semibold">{{ data.total_assets }}</p>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-lg p-5 shadow">
            <h3 class="text-lg font-bold">Kategori</h3>
            <ul>
                <li v-for="item in data.by_category" :key="item.category_id" class="text-sm">{{ item.category_name }}: {{ item.total }}</li>
            </ul>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-lg p-5 shadow">
            <h3 class="text-lg font-bold">Kondisi</h3>
            <ul>
                <li v-for="item in data.by_condition" :key="item.condition_id" class="text-sm">{{ item.condition_name }}: {{ item.total }}</li>
            </ul>
        </div>
    </div>
</template>
