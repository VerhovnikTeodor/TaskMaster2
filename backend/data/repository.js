const useMemory =
  process.env.USE_MEMORY_STORE === 'true' || !process.env.DATABASE_URL;

module.exports = useMemory
  ? require('./memoryRepository')
  : require('./pgRepository');
