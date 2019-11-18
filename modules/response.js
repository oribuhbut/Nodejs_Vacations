module.exports={
    success:true,
    error:false,
    message:"",
    data:[],
    getResponse(success,error,message,data){
        this.success = success,
        this.error = error,
        this.message = message,
        this.data = data;
    },
    responseMessage(){
        this.success,
        this.error,
        this.message,
        this.data
        return this;
    }
}