<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-text">
          <h1>Админ-панель F1 Forum</h1>
          <p>Обзор системы и статистика</p>
        </div>
        <button @click="downloadReport" class="btn btn-success download-btn" :disabled="loading">
          📊 Скачать отчет (PDF)
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка статистики...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>{{ stats.totalUsers }}</h3>
            <p>Пользователей</p>
            <small>+{{ stats.newUsersToday }} сегодня</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <h3>{{ stats.totalTopics }}</h3>
            <p>Тем</p>
            <small>+{{ stats.newTopicsToday }} сегодня</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-info">
            <h3>{{ stats.totalComments }}</h3>
            <p>Комментариев</p>
            <small>+{{ stats.newCommentsToday }} сегодня</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🏁</div>
          <div class="stat-info">
            <h3>{{ stats.totalRaces }}</h3>
            <p>Гонок в базе</p>
          </div>
        </div>
      </div>

      <div class="recent-activity">
        <h2>Последняя активность на сайте</h2>
        <div class="activity-list">
          <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
            <span class="activity-type" :class="activity.type">{{ getActivityTypeText(activity.type) }}</span>
            <span class="activity-desc">
              <strong>{{ activity.title }}</strong> - {{ activity.description }}
            </span>
            <span class="activity-time">{{ formatActivityDate(activity.activity_date) }}</span>
          </div>
          <div v-if="recentActivity.length === 0" class="no-activity">
            Активности пока нет
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const stats = ref({
  totalUsers: 0,
  totalTopics: 0,
  totalComments: 0,
  totalRaces: 0,
  newUsersToday: 0,
  newTopicsToday: 0,
  newCommentsToday: 0
});
const recentActivity = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  await loadStats();
});

const loadStats = async () => {
  try {
    loading.value = true;
    const response = await api.get('/admin/stats');
    
    if (response.data.success) {
      stats.value = response.data.stats;
      recentActivity.value = response.data.recentActivity;
    } else {
      error.value = 'Ошибка загрузки статистики';
    }
  } catch (err) {
    console.error('Error loading stats:', err);
    error.value = 'Не удалось загрузить статистику';
  } finally {
    loading.value = false;
  }
};

const getActivityTypeText = (type) => {
  const types = {
    user: '👤',
    topic: '📝', 
    comment: '💬'
  };
  return types[type] || type;
};

const formatActivityDate = (dateString) => {
  if (!dateString) return 'Неизвестно';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Сегодня в ' + date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Вчера в ' + date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('ru-RU') + ' в ' + 
             date.toLocaleTimeString('ru-RU', { 
               hour: '2-digit', 
               minute: '2-digit' 
             });
    }
  } catch (error) {
    return 'Неверная дата';
  }
};

const downloadReport = async () => {
  try {
    loading.value = true;
    
    // Динамически импортируем библиотеки для PDF
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    // Создаем PDF документ
    const doc = new jsPDF();
    
    // Добавляем поддержку кириллицы
    // Устанавливаем стандартный шрифт, который поддерживает кириллицу
    doc.setFont('helvetica');
    
    // Заголовок отчета
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('F1 Forum - Системный отчет', 20, 30);
    
    // Дата генерации
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Сгенерировано: ${new Date().toLocaleString('ru-RU')}`, 20, 45);
    
    // Статистика
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Статистика системы', 20, 65);
    
    // Таблица статистики с использованием autoTable
    autoTable(doc, {
      startY: 75,
      head: [['Показатель', 'Всего', 'За сегодня']],
      body: [
        ['Пользователи', stats.value.totalUsers.toString(), stats.value.newUsersToday.toString()],
        ['Темы', stats.value.totalTopics.toString(), stats.value.newTopicsToday.toString()],
        ['Комментарии', stats.value.totalComments.toString(), stats.value.newCommentsToday.toString()],
        ['Гонки в базе', stats.value.totalRaces.toString(), '-'],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [225, 6, 0], // F1 красный цвет
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        font: 'helvetica',
        fontSize: 12,
        cellPadding: 3,
      },
    });

    // Последняя активность
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.text('Последняя активность', 20, finalY);

    if (recentActivity.value.length > 0) {
      const activityData = recentActivity.value.map(activity => [
        activity.title,
        activity.description,
        formatDateForPDF(activity.activity_date)
      ]);

      autoTable(doc, {
        startY: finalY + 10,
        head: [['Пользователь', 'Действие', 'Дата']],
        body: activityData,
        theme: 'grid',
        headStyles: {
          fillColor: [40, 40, 40],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 60 },
          2: { cellWidth: 40 }
        }
      });
    } else {
      doc.setFontSize(12);
      doc.text('Активность не найдена', 20, finalY + 15);
    }

    // Футер
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Страница ${i} из ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Сохраняем PDF
    doc.save(`f1-forum-report-${new Date().toISOString().split('T')[0]}.pdf`);
    
  } catch (err) {
    console.error('Ошибка при создании отчета:', err);
    alert('Ошибка при создании отчета: ' + err.message);
  } finally {
    loading.value = false;
  }
};
const formatDateForPDF = (dateString) => {
  if (!dateString) return 'Неизвестно';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Неверная дата';
  }
};
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-text h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 2rem;
}

.header-text p {
  margin: 0;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.download-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(39, 174, 96, 0.2);
}

.download-btn:hover {
  background: #219a52;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(39, 174, 96, 0.3);
}

.download-btn:active {
  transform: translateY(0);
}

.download-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.stat-icon {
  font-size: 2rem;
}

.stat-info h3 {
  font-size: 2rem;
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.stat-info p {
  margin: 0;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-info small {
  color: #27ae60;
  font-size: 0.8rem;
  font-weight: 500;
}

.recent-activity {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.recent-activity h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.activity-list {
  margin-top: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.2s ease;
}

.activity-item:hover {
  background-color: #f8f9fa;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-type {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
  background: #f8f9fa;
}

.activity-desc {
  flex: 1;
  color: #2c3e50;
}

.activity-desc strong {
  color: #e10600;
}

.activity-time {
  color: #95a5a6;
  font-size: 0.9rem;
  min-width: 150px;
  text-align: right;
}

.no-activity {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  font-style: italic;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  margin: 2rem 0;
  border: 1px solid #f5c6cb;
}

/* Адаптивность */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 15px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .download-btn {
    align-self: center;
    width: 100%;
    justify-content: center;
  }
  
  .header-text h1 {
    font-size: 1.5rem;
    text-align: center;
  }
  
  .header-text p {
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .activity-time {
    align-self: flex-end;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }
  
  .stat-icon {
    font-size: 1.5rem;
  }
  
  .stat-info h3 {
    font-size: 1.5rem;
  }
}
</style>