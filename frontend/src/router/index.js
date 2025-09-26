import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DriversView from '../views/DriversView.vue';
import ConstructorsView from '../views/ConstructorsView.vue';
import CircuitsView from '../views/CircuitsView.vue';
import RacesView from '../views/RacesView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/drivers',
    name: 'drivers',
    component: DriversView
  },
  {
    path: '/constructors',
    name: 'constructors',
    component: ConstructorsView
  },
  {
    path: '/circuits',
    name: 'circuits',
    component: CircuitsView
  },
  {
    path: '/races',
    name: 'races',
    component: RacesView
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;