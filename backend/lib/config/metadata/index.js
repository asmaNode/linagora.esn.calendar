module.exports = dependencies => ({
  rights: {
    admin: 'rw',
    user: 'r'
  },
  configurations: {
    workingDays: require('./working-days')(dependencies),
    hideDeclinedEvents: require('./hide-declined-events')(dependencies)
  }
});
