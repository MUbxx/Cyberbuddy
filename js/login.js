import { auth, db } from "./firebase.js";

import {
signInWithEmailAndPassword,
GoogleAuthProvider,
signInWithPopup,
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
doc,
setDoc,
getDoc
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


/* AUTO LOGIN REDIRECT */

onAuthStateChanged(auth,(user)=>{

if(user){
window.location="dashboard.html";
}

});


/* EMAIL LOGIN */

document.getElementById("loginBtn").onclick = async () => {

const email=document.getElementById("email").value;
const password=document.getElementById("password").value;

try{

await signInWithEmailAndPassword(auth,email,password);

window.location="dashboard.html";

}
catch(err){

alert("Login Failed: "+err.message);

}

};


/* GOOGLE OAUTH LOGIN */

document.getElementById("googleLoginBtn").onclick = async () => {

const provider=new GoogleAuthProvider();

try{

const result = await signInWithPopup(auth,provider);

const user=result.user;

/* CHECK IF USER EXISTS */

const ref=doc(db,"users",user.uid);

const snap=await getDoc(ref);

if(!snap.exists()){

await setDoc(ref,{

name:user.displayName,
email:user.email,
phone:"",
purchasedCourses:[],
createdAt:new Date()

});

}

/* REDIRECT */

window.location="dashboard.html";

}
catch(err){

console.error(err);

alert("Google Login Failed");

}

};
