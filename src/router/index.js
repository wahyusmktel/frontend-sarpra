import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/assets',
                    name: 'assets',
                    component: () => import('@/views/pages/assets/AssetList.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/assets/:id/edit',
                    name: 'editAsset',
                    component: () => import('@/views/pages/assets/AssetEdit.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/assets/:id',
                    name: 'detailAsset',
                    component: () => import('@/views/pages/assets/AssetDetail.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/asset-categories',
                    name: 'asset-categories',
                    component: () => import('@/views/AssetCategoryList.vue')
                },
                {
                    path: '/asset-types',
                    name: 'asset-types',
                    component: () => import('@/views/asset/AssetTypeList.vue')
                },
                {
                    path: '/asset-conditions',
                    name: 'asset-conditions',
                    component: () => import('@/views/pages/assets/AssetConditionList.vue')
                },
                {
                    path: '/asset-locations',
                    name: 'lokasi-aset',
                    component: () => import('@/views/pages/assets/AssetLocationList.vue')
                },
                {
                    path: '/assets/documents',
                    name: 'assets/documents',
                    component: () => import('@/views/pages/assets/AssetDocument.vue')
                },
                {
                    path: '/assets/scanner',
                    name: 'assets/scanner',
                    component: () => import('@/views/pages/assets/AssetQrScanner.vue')
                },
                {
                    path: '/assets/asset-loans',
                    name: 'assets/asset-loans',
                    component: () => import('@/views/pages/assets/AssetLoan.vue')
                },
                {
                    path: '/assets/asset-usages',
                    name: 'assets/asset-usages',
                    component: () => import('@/views/pages/assets/AssetUsage.vue')
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue')
                },

                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/views/uikit/OverlayDoc.vue')
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue')
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/views/uikit/MiscDoc.vue')
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/views/uikit/TimelineDoc.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/views/pages/Crud.vue')
                },
                {
                    path: '/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue')
                }
            ]
        },
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },

        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');

    if (to.meta.requiresAuth && !token) {
        next({ name: 'login' });
    } else if ((to.name === 'login' || to.path === '/auth/login') && token) {
        next({ name: 'dashboard' });
    } else {
        next();
    }
});

export default router;
