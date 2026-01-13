import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X, Plus, Trash2 } from 'lucide-react';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    recurrence: 'once',
    color: 'blue'
  });

  useEffect(() => {
    // Charger les événements depuis localStorage
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  const colorClasses = {
    blue: { bg: 'bg-blue-500', ring: 'ring-blue-400', text: 'text-blue-400' },
    purple: { bg: 'bg-purple-500', ring: 'ring-purple-400', text: 'text-purple-400' },
    green: { bg: 'bg-green-500', ring: 'ring-green-400', text: 'text-green-400' },
    red: { bg: 'bg-red-500', ring: 'ring-red-400', text: 'text-red-400' },
    yellow: { bg: 'bg-yellow-500', ring: 'ring-yellow-400', text: 'text-yellow-400' }
  };

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Générer les 7 prochains jours
  const getDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date) => {
    return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
  };

  // Obtenir les événements pour une date
  const getEventsForDate = (date) => {
    const dateStr = formatDate(date);
    
    return events.filter(event => {
      if (event.date === dateStr) {
        return true;
      }
      
      if (event.recurrence === 'weekly') {
        const eventDate = new Date(event.date);
        return eventDate.getDay() === date.getDay() && date >= eventDate;
      }
      
      if (event.recurrence === 'monthly') {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === date.getDate() && date >= eventDate;
      }
      
      return false;
    });
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    
    const event = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: formatDate(selectedDate),
      recurrence: newEvent.recurrence,
      color: newEvent.color
    };

    const updatedEvents = [...events, event];
    setEvents(updatedEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));

    setNewEvent({ title: '', recurrence: 'once', color: 'blue' });
  };

  const handleDeleteEvent = (eventId) => {
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
  };

  const openModal = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewEvent({ title: '', recurrence: 'once', color: 'blue' });
  };

  const days = getDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      {/* Section Calendrier */}
      <div className="mb-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-1">
              Planning de la semaine
            </h2>
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              <p className="text-slate-400 text-sm font-medium">
                7 prochains jours
              </p>
            </div>
          </div>
        </div>

        {/* Calendrier horizontal */}
        <div className="grid grid-cols-7 gap-3">
          {days.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isToday = formatDate(date) === formatDate(today);

            return (
              <div
                key={index}
                onClick={() => openModal(date)}
                className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isToday ? 'transform scale-105' : ''
                }`}
              >
                {/* Glow effect */}
                <div className={`absolute -inset-0.5 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500 ${
                  isToday 
                    ? 'bg-gradient-to-br from-blue-500/40 to-purple-500/40 opacity-75' 
                    : 'bg-gradient-to-br from-slate-600/30 to-slate-700/30'
                }`}></div>

                {/* Card */}
                <div className={`relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-4 border backdrop-blur-sm overflow-hidden ${
                  isToday 
                    ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' 
                    : 'border-slate-700/50'
                }`}>
                  
                  {/* Jour */}
                  <div className="text-center mb-3">
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                      {dayNames[date.getDay()]}
                    </div>
                    <div className={`text-4xl font-bold mb-1 ${
                      isToday ? 'bg-gradient-to-br from-blue-400 to-purple-500 bg-clip-text text-transparent' : 'text-white'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {monthNames[date.getMonth()]}
                    </div>
                  </div>

                  {/* Badge "Aujourd'hui" */}
                  {isToday && (
                    <div className="flex items-center justify-center mb-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm animate-pulse"></div>
                        <div className="relative px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-full">
                          <span className="text-xs text-blue-300 font-semibold">Aujourd'hui</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Événements */}
                  {dayEvents.length > 0 ? (
                    <div className="flex flex-col gap-1.5 mt-3">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-2 group/event"
                        >
                          <div className={`w-2 h-2 rounded-full ${colorClasses[event.color].bg} group-hover/event:scale-125 transition-transform`}></div>
                          <span className="text-xs text-slate-300 truncate flex-1 group-hover/event:text-white transition-colors">
                            {event.title}
                          </span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-slate-500 text-center mt-1">
                          +{dayEvents.length - 2} autre{dayEvents.length - 2 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 text-center">
                      <div className="inline-flex items-center gap-1 text-xs text-slate-600 group-hover:text-slate-500 transition-colors">
                        <Plus className="w-3 h-3" />
                        <span>Ajouter</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={closeModal}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8 border border-slate-700 transform transition-all">
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {formatDateDisplay(selectedDate)}
                  </h2>
                </div>
                <div className="h-px bg-gradient-to-r from-green-500/50 via-emerald-500/50 to-transparent"></div>
              </div>

              {/* Liste des événements */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-300 mb-4">Événements du jour</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Aucun événement pour ce jour</p>
                  ) : (
                    getEventsForDate(selectedDate).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between bg-slate-700/50 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-all group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-3 h-3 rounded-full ${colorClasses[event.color].bg}`}></div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{event.title}</div>
                            <div className="text-sm text-slate-400">
                              {event.recurrence === 'once' ? 'Unique' : 
                               event.recurrence === 'weekly' ? 'Chaque semaine' : 
                               'Chaque mois'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Formulaire */}
              <div className="border-t border-slate-700/50 pt-6">
                <h3 className="text-lg font-semibold text-green-400 mb-4">Ajouter un événement</h3>
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Titre de l'événement"
                      required
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-white placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2 font-medium">Type de récurrence</label>
                    <select
                      value={newEvent.recurrence}
                      onChange={(e) => setNewEvent({ ...newEvent, recurrence: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-white"
                    >
                      <option value="once">Une seule fois</option>
                      <option value="weekly">Chaque semaine</option>
                      <option value="monthly">Chaque mois</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-3 font-medium">Couleur</label>
                    <div className="flex gap-3">
                      {Object.keys(colorClasses).map((color) => (
                        <label key={color} className="cursor-pointer">
                          <input
                            type="radio"
                            name="color"
                            value={color}
                            checked={newEvent.color === color}
                            onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                            className="hidden peer"
                          />
                          <div className={`w-10 h-10 rounded-full ${colorClasses[color].bg} peer-checked:ring-4 ${colorClasses[color].ring} transition-all hover:scale-110`}></div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 text-white shadow-lg shadow-green-500/20"
                  >
                    Ajouter l'événement
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Calendar;
