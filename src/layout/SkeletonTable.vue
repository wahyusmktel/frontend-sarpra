<script setup>
import Skeleton from 'primevue/skeleton';
</script>

<template>
    <div>
        <div v-for="n in 8" :key="n" class="grid grid-cols-5 gap-4 mb-3">
            <Skeleton height="2rem" class="col-span-1" />
            <Skeleton height="2rem" class="col-span-1" />
            <Skeleton height="2rem" class="col-span-1" />
            <Skeleton height="2rem" class="col-span-1" />
            <Skeleton height="2rem" class="col-span-1" />
        </div>
    </div>
</template>
