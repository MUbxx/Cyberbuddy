import { auth, db } from "./firebase.js";

import {
signInWithEmailAndPassword,
GoogleAuthProvider,
signInWithPopup,
sendPasswordResetEmail,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
doc,
setDoc,
getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


const loginBtn = document.getElementById("loginBtn");
const googleBtn = document.getElementById("googleLoginBtn");
const forgotBtn = document.getElementById("forgotBtn");


/* AUTO REDIRECT IF LOGGED */

onAuthStateChanged(auth,(user)=>{

if(user){
window.location="dashboard.html";
}

});


/* EMAIL LOGIN */

loginBtn.onclick = async () => {

const email=document.getElementById("email").value;
const password=document.getElementById("password").value;

if(!email || !password){
alert("Please enter email and password");
return;
}

loginBtn.innerText="Logging in...";
loginBtn.disabled=true;

try{

await signInWithEmailAndPassword(auth,email,password);

window.location="dashboard.html";

}
catch(err){

console.error(err);

alert(err.message);

}

loginBtn.innerText="Login";
loginBtn.disabled=false;

};



/* GOOGLE OAUTH */

googleBtn.onclick = async () => {

const provider=new GoogleAuthProvider();

try{

const result=await signInWithPopup(auth,provider);

const user=result.user;

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

window.location="dashboard.html";

}
catch(err){

console.error(err);
alert("Google Login Failed");

}

};



/* PASSWORD RESET */

forgotBtn.onclick = async ()=>{

const email=document.getElementById("email").value;

if(!email){
alert("Enter your email first");
return;
}

try{

await sendPasswordResetEmail(auth,email);

alert("Password reset link sent to your email");

}
catch(err){

alert(err.message);

}

};
