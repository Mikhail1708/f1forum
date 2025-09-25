<template>
  <div class="driver-card">
    <div class="driver-header">
      <h3>{{ driver.givenName }} {{ driver.familyName }}</h3>
      <span class="driver-number">#{{ driver.permanentNumber }}</span>
    </div>
    <div class="driver-info">
      <p><strong>Код:</strong> {{ driver.code }}</p>
      <p><strong>Национальность:</strong> {{ driver.nationality }}</p>
      <p><strong>Дата рождения:</strong> {{ formatDate(driver.dateOfBirth) }}</p>
    </div>
    <a :href="driver.url" target="_blank" class="wiki-link">Wikipedia →</a>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  driver: {
    type: Object,
    required: true
  }
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};
</script>