import { auth, db } from "firebase.js";

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


// LOGIN
if (loginBtn) {

loginBtn.addEventListener("click", async () => {

try {

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

const userCred = await signInWithEmailAndPassword(auth, email, password);

const userDoc = await getDoc(doc(db,"users",userCred.user.uid));

const userData = userDoc.data();

if(userData.role === "admin"){

window.location.href = "admin.html";

}else{

window.location.href = "dashboard.html";

}

} catch(err){

alert(err.message);

}

});

}


// REGISTER
if (registerBtn) {

registerBtn.addEventListener("click", async () => {

try {

const name = document.getElementById("name").value;
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

const userCred = await createUserWithEmailAndPassword(auth,email,password);

await setDoc(doc(db,"users",userCred.user.uid),{

name:name,
email:email,
role:"student",
purchasedCourses:[]

});

alert("Registration successful");

window.location.href = "login.html";

} catch(err){

alert(err.message);

}

});

}