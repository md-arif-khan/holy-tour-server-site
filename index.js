const express =require('express')
const cors = require('cors');
const jwt=require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app =express()
const port =process.env.PORT || 5000;
// db name:holy-tourDb
// password:CehlJgUyRoHaxToh
// db name: holyTourServices
// services
app.use(cors())
app.use(express.json())



const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jq2it7m.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function veryfyJWT(req,res,next){
  const authHeader=req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:'unauthorized access'})
  }
  const token=authHeader.split(' ')[1]
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,function(err,decoded){
    if(err){
        return res.status(401).send({message:'unauthorized access'})
    }
    req.decoded=decoded;
    next();
  })
} 

async function run(){
   try{
    const serviceCollection=client.db('holyTourServices').collection('services')
    const reviewCollection=client.db('holyTourServices').collection('review')
    
    app.post('/jwt',(req,res)=>{
        const user=req.body;
        const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
        res.send({token})
        
    })
    
    app.get('/services',async (req,res)=>{
        const query={}
        const cursor=serviceCollection.find(query).limit(3)
        const services=await cursor.toArray()
        res.send(services)
    })

    app.get('/allData',async (req,res)=>{
        const query={}
        const cursor=serviceCollection.find(query)
        const services=await cursor.toArray()
        res.send(services)
    })
    app.post('/addservice',async(req,res)=>{
        const addService=req.body;
        const cursor=await serviceCollection.insertOne(addService)
        res.send(cursor)
    })
    app.get('/cardDetails/:id',async (req,res)=>{
        const id=req.params.id
        const query={_id:ObjectId(id)}
        const cursor=await serviceCollection.findOne(query)
        res.send(cursor)
    })
    app.get('/userreview',veryfyJWT,async(req,res)=>{
     
        let query={}
        if(req.query.email){
            query={
                email:req.query.email
            }
        }
     
        const cursor=reviewCollection.find(query)
        const review=await cursor.toArray()
        res.send(review)
    })
    app.delete('/review/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id:ObjectId(id)}
        const result=await reviewCollection.deleteOne(query)
        res.send(result)
    })

    app.get('/update/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id:ObjectId(id)}
        const cursor=await reviewCollection.findOne(query)
        res.send(cursor)

    })
    app.put('/update/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id:ObjectId(id)}
        const updateUser=req.body;
        const option={upsert:true}
        const updateMessage={
            $set:{
                message:updateUser.review
            }
        }
        const result=await reviewCollection.updateOne(query,updateMessage,option)  
        res.send(result)
    })
    app.get('/review/:id',async (req,res)=>{
        const id=req.params.id;
        const query={reviewId:id}
        const cursor=reviewCollection.find(query)
        const result=await cursor.toArray()
        res.send(result)
        
    })
    app.post('/review',async (req,res)=>{
        const user=req.body;
        const result=await reviewCollection.insertOne(user)
        res.send(result)
    })
   }
   catch{err=>console.log(err)}
}
run().catch(err=>console.log(err))



app.get('/',(req,res)=>{
    res.send('server is ok')
})
app.listen(port,()=>{
    console.log(`server is running. ${port}`)
})