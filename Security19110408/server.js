const path = require('path')
const express = require('express')
const htpps = require('https');
const fs = require('fs')
const helmet = require('helmet')
const passport = require('passport')
const {Strategy} = require('passport-google-oauth20')
const cookieSession = require('cookie-session')

require('dotenv').config()

const config = {
    CLIENT_ID : process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    COOKIE_KEY_1:process.env.COOKIE_KEY_1,
    COOKIE_KEY_2:process.env.COOKIE_KEY_2
}
const AUTH_POTIONS = {
    callbackURL: '/auth/google/callback',
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET
}


function checkLoggedIn(req,res,next){
    console.log(`Current login user is: ${req.user}`)
    const isLoggedIn= req.isAuthenticated() && req.user
    if(!isLoggedIn){
        return res.status(401).json({
            error:'You must log in!'
        })
    }
    next()
}

function verifyCallback(accesssToken, refreshToken, profile,done){
    console.log('Google profile',profile)
    done(null, profile)
}

passport.use(new Strategy(AUTH_POTIONS,verifyCallback))

// Save the session to the cookie
passport.serializeUser((user,done)=>{
    done(null,user.id)
})

//Read the session from the cookie
passport.deserializeUser((id, done)=>{
    // User.findById(id).then(user=>{
    //     done(null,user)
    // })
    done(null,id)
})

const PORT = 3000
const app = express();

app.use(helmet());
app.use(cookieSession({
    name: 'session',
    maxAge: 60*60*1000*24,
    keys: [config.COOKIE_KEY_1, config.COOKIE_KEY_2]
}))

app.use(passport.initialize())
app.use(passport.session())

app.get('/auth/google',passport.authenticate('google',{
    scope: ['email']
}))

app.get('/auth/google/callback',passport.authenticate('google',{
    failureRedirect:'/failure',
    successRedirect:'/',
    session: true
}),(req,res)=>{
    console.log('Goole called us back!')
})

app.get('/auth/logout',(req,res)=>{
    req.logout()
    return res.redirect('/')
})

app.get('/secret',checkLoggedIn,(req,res)=>{
    return res.send('you personnal secret value is 42!')
})

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','index.html'))
})

htpps.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
},app).listen(PORT,()=>{
    console.log(`Listening on port ${PORT}...`)
})