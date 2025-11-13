const GrandPrix = require('../models/GrandPrix');

exports.getNextGrandPrix = async (req, res) => {
    try {
        const nextGP = await GrandPrix.getNext();
        res.json({ success: true, data: nextGP });
    } catch (error) {
        console.error('Ошибка получения ближайшего Гран-при:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
};

exports.getUpcomingEvents = async (req, res) => {
    try {
        const events = await GrandPrix.getUpcoming();
        res.json({ success: true, data: events });
    } catch (error) {
        console.error('Ошибка получения событий:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
};

exports.getAllGrandPrix = async (req, res) => {
    try {
        const grandPrix = await GrandPrix.findAll();
        res.json({ success: true, data: grandPrix });
    } catch (error) {
        console.error('Ошибка получения всех Гран-при:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
};