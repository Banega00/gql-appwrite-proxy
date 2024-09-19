export const resolvers = {
  health() {
    return 'health+1+2';
  },

  findAllGroupsOfUser(name: String) {
    return name;
  },
};
