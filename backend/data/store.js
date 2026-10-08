// In-memory data store (uporablja se za teste in lokalni razvoj brez PostgreSQL)
const users = [];
const projects = [];
const tasks = [];
const comments = [];

module.exports = {
  users,
  projects,
  tasks,
  comments
};
