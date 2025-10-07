import mongosse, { Schema } from "mongoose"

const subscriptionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,  // one who is subscribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,  // one who subscriber is subscribing
        ref:"User"
    },
},
{timestamps:true}
)



export const Subscription = mongosse.model("Subscription",subscriptionSchema)