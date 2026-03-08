import { auth, db } from "./firebase.js";

import {
createUserWithEmailAndPassword,
sendEmailVerification
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
doc,
setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


document.getElementById("registerBtn").onclick = async () => {

const name=document.getElementById("name").value;
const phone=document.getElementById("phone").value;
const email=document.getElementById("email").value;
const password=document.getElementById("password").value;

try{

const res=await createUserWithEmailAndPassword(auth,email,password);

await sendEmailVerification(res.user);

await setDoc(doc(db,"users",res.user.uid),{

name:name,
phone:phone,
email:email,
role:"user",
purchasedCourses:[],
createdAt:new Date()

});

alert("Verification email sent. Verify before login.");

location="login.html";

}catch(err){

alert(err.message);

}

};
