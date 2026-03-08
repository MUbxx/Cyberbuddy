import { auth, db } from "./firebase.js";

import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
doc,
setDoc,
getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

if(loginBtn){

loginBtn.onclick = async ()=>{

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

const user = await signInWithEmailAndPassword(auth,email,password);

const userDoc = await getDoc(doc(db,"users",user.user.uid));

const role = userDoc.data().role;

if(role==="admin"){

window.location="admin.html";

}else{

window.location="dashboard.html";

}

};

}

if(registerBtn){

registerBtn.onclick = async ()=>{

const name = document.getElementById("name").value;
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

const user = await createUserWithEmailAndPassword(auth,email,password);

await setDoc(doc(db,"users",user.user.uid),{

name:name,
email:email,
role:"student",
purchasedCourses:[]

});

alert("Registered successfully");

window.location="login.html";

};

}
