import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc,
updateDoc
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
onAuthStateChanged,
signOut,
sendPasswordResetEmail
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const coursesGrid=document.getElementById("coursesGrid");
const myCoursesGrid=document.getElementById("myCoursesGrid");

let purchasedCourses=[];


/* AUTH */

onAuthStateChanged(auth,async(user)=>{

if(!user){
window.location="login.html";
return;
}

const userDoc=await getDoc(doc(db,"users",user.uid));
const data=userDoc.data();

document.getElementById("userName").innerText=data.name||"User";
document.getElementById("userEmail").innerText=data.email||"";

document.getElementById("editName").value=data.name||"";
document.getElementById("editPhone").value=data.phone||"";

purchasedCourses=data.purchasedCourses||[];

loadCourses();

});


/* COURSES */

async function loadCourses(){

coursesGrid.innerHTML="";
myCoursesGrid.innerHTML="";

const snap=await getDocs(collection(db,"courses"));

snap.forEach(course=>{

const data=course.data();
const id=course.id;

const card=document.createElement("div");

card.className="glass p-5 rounded-xl";

card.innerHTML=`

<img src="${data.image}"
class="h-40 w-full object-cover rounded-lg mb-4">

<h3 class="font-bold">${data.title}</h3>

<p class="text-xs text-slate-400 mt-2">
${data.description||""}
</p>

<button onclick="openCourse('${id}')"
class="mt-4 bg-blue-600 px-4 py-2 rounded-lg text-sm">

Start Learning

</button>

`;

coursesGrid.appendChild(card);

if(purchasedCourses.includes(id)){
myCoursesGrid.appendChild(card.cloneNode(true))
}

})

}


/* COURSE */

window.openCourse=(id)=>{
window.location="course.html?id="+id
}


/* PROFILE */

document.getElementById("saveProfile").onclick=async()=>{

const name=document.getElementById("editName").value
const phone=document.getElementById("editPhone").value

const user=auth.currentUser

await updateDoc(doc(db,"users",user.uid),{
name,
phone
})

alert("Profile updated")

}


/* PASSWORD RESET */

document.getElementById("resetBtn").onclick=async()=>{

const user=auth.currentUser

await sendPasswordResetEmail(auth,user.email)

alert("Reset link sent")

}


/* CERTIFICATES */

window.loadCertificates = async () => {

const list = document.getElementById("certList")
list.innerHTML="Loading..."

try{

const res = await fetch(
"https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/certificates.json"
)

const data = await res.json()

const user = auth.currentUser

const userCerts=data.certificates.filter(c=>c.email===user.email)

list.innerHTML=""

if(userCerts.length===0){

list.innerHTML="No certificates available"

return

}

userCerts.forEach(cert=>{

list.innerHTML+=`

<div class="glass p-4 rounded-xl flex justify-between">

<div>

<h4 class="font-bold text-blue-400">${cert.course}</h4>

<p class="text-xs text-slate-400">${cert.type}</p>

</div>

<a href="certificate.html?id=${cert.certId}"
class="bg-blue-600 px-4 py-2 rounded-lg text-xs">

View

</a>

</div>

`

})

}catch(err){

list.innerHTML="Error loading certificates"
console.error(err)

}

}



/* BILLING */

window.loadInvoices = async () => {

const list=document.getElementById("invoiceList")
list.innerHTML="Loading..."

try{

const res=await fetch(
"https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/bills.json"
)

const bills=await res.json()

const user=auth.currentUser

const userBills=bills.filter(b=>b.email===user.email)

list.innerHTML=""

if(userBills.length===0){

list.innerHTML="No billing history"
return

}

userBills.forEach(bill=>{

list.innerHTML+=`

<div class="glass p-4 rounded-xl flex justify-between">

<div>

<h4 class="font-bold text-green-400">${bill.course}</h4>

<p class="text-xs text-slate-400">
₹${bill.amount} • ${bill.date}
</p>

</div>

<a href="${bill.verifyUrl}"
target="_blank"
class="bg-green-600 px-4 py-2 rounded-lg text-xs">

Verify

</a>

</div>

`

})

}catch(err){

list.innerHTML="Error loading billing data"
console.error(err)

}

}


/* SIDEBAR */

const sidebar=document.getElementById("sidebar")
const toggle=document.getElementById("toggleSidebar")

toggle.onclick=()=>{
sidebar.classList.toggle("collapsed")
}


/* LOGOUT */

document.getElementById("logoutBtn").onclick=async()=>{

await signOut(auth)

window.location="login.html"

}
