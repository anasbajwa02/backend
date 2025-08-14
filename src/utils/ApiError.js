class ApiError extends Error{
    constructor(
        statusCode,
        message="somthing went wrong",
        errors=[],
        statck=""

    ){
     super(message)
     this.statusCode = statusCode;
     this.data = null;
     this.success = false;
     this.errors = errors;
     this.statck = statck;
     if(statck){
        this.stack = statck

     }else{
        Error.captureStackTrace(this,this.constructor)
     }
    }
} 
export default ApiError; 