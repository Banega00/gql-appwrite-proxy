export const resolvers = {
  health() {
    return 'health+1+2';
  },

  findAllGroupsOfUser(_: any, name: String) {
    
    return name;
  },
};
