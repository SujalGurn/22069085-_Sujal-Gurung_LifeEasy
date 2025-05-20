class UserModel {
    constructor(user) {
      this.fullname = user.fullname || '';
      this.username = user.username || '';

      this.dateofbirth = user.dateofbirth || '';
      this.contact = user.contact || '';
      this.email = user.email || '';
      
      this.password = user.password || '';
    }
  }
  export default UserModel;