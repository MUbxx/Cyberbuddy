import { auth, db } from "./firebase.js";

import {
signInWithEmailAndPassword,
GoogleAuthProvider,
signInWithPopup,
sendPasswordResetEmail
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
doc,
getDoc,
setDoc
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


/* EMAIL LOGIN */

document.getElementById("loginBtn").onclick = async () => {

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

try{

const result = await signInWithEmailAndPassword(auth,email,password);

await redirectUser(result.user);

}catch(err){

alert(err.message);

}

};


/* GOOGLE LOGIN */

document.getElementById("googleBtn").onclick = async () => {

const provider = new GoogleAuthProvider();

try{

const result = await signInWithPopup(auth,provider);

const user = result.user;

const ref = doc(db,"users",user.uid);
const snap = await getDoc(ref);

if(!snap.exists()){

let role="user";

if(user.email==="admin@cyberbuddy.com"){
role="admin";
}

await setDoc(ref,{
name:user.displayName,
email:user.email,
role:role,
purchasedCourses:[],
createdAt:new Date()
});

}

await redirectUser(user);

}catch(err){

alert(err.message);

}

};


/* PASSWORD RESET */

document.getElementById("forgotBtn").onclick = async () => {

const email=document.getElementById("email").value;

if(!email){
alert("Enter your email first");
return;
}

try{

await sendPasswordResetEmail(auth,email);

alert("Password reset email sent");

}catch(err){

alert(err.message);

}

};



/* REDIRECT LOGIC */

async function redirectUser(user){

const ref = doc(db,"users",user.uid);

const snap = await getDoc(ref);

const data = snap.data();

if(data.role === "admin"){

window.location="admin.html";

}else{

window.location="dashboard.html";

}

}
