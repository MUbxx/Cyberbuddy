import { auth, db } from "./firebase.js";

import {
signInWithEmailAndPassword,
GoogleAuthProvider,
signInWithPopup,
sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
doc,
getDoc,
setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


const loginBtn=document.getElementById("loginBtn");
const googleBtn=document.getElementById("googleLoginBtn");
const forgotBtn=document.getElementById("forgotBtn");


loginBtn.onclick=async()=>{

const email=document.getElementById("email").value;
const password=document.getElementById("password").value;

try{

const res=await signInWithEmailAndPassword(auth,email,password);

if(!res.user.emailVerified){

alert("Verify your email first");
return;

}

redirectUser(res.user);

}catch(err){

alert(err.message);

}

};


googleBtn.onclick=async()=>{

const provider=new GoogleAuthProvider();

const result=await signInWithPopup(auth,provider);

const user=result.user;

const ref=doc(db,"users",user.uid);

const snap=await getDoc(ref);

if(!snap.exists()){

await setDoc(ref,{
name:user.displayName,
email:user.email,
role:"user",
purchasedCourses:[]
});

}

redirectUser(user);

};


forgotBtn.onclick=async()=>{

const email=document.getElementById("email").value;

await sendPasswordResetEmail(auth,email);

alert("Reset email sent");

};


async function redirectUser(user){

const ref=doc(db,"users",user.uid);

const snap=await getDoc(ref);

const data=snap.data();

if(data.role==="admin"){

location="admin.html";

}else{

location="dashboard.html";

}

}
