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


const coursesGrid = document.getElementById("coursesGrid");
const myCoursesGrid = document.getElementById("myCoursesGrid");

let purchasedCourses=[];


/* AUTH */

onAuthStateChanged(auth, async(user)=>{

if(!user){

window.location="login.html";
return;

}

const userDoc=await getDoc(doc(db,"users",user.uid));
const data=userDoc.data();

document.getElementById("userName").innerText=data.name;
document.getElementById("userEmail").innerText=data.email;

purchasedCourses=data.purchasedCourses || [];

document.getElementById("statCourses").innerText=purchasedCourses.length;

loadCourses();

});



/* LOAD COURSES */

async function loadCourses(){

coursesGrid.innerHTML="";
myCoursesGrid.innerHTML="";

const snap=await getDocs(collection(db,"courses"));

snap.forEach(course=>{

const data=course.data();
const id=course.id;

const card=document.createElement("div");

card.className="course-card glass p-5 rounded-xl";

card.innerHTML=`

<img src="${data.image}"
class="h-40 w-full object-cover rounded-lg mb-4">

<h3 class="font-bold text-lg">${data.title}</h3>

<p class="text-xs text-slate-400 mt-2">
${data.description || ""}
</p>

<button
onclick="openCourse('${id}')"
class="mt-4 bg-blue-600 px-4 py-2 rounded-lg text-sm">

Start Learning

</button>

`;

coursesGrid.appendChild(card);

if(purchasedCourses.includes(id)){

myCoursesGrid.appendChild(card.cloneNode(true));

}

});

}



/* COURSE PAGE */

window.openCourse=(id)=>{

window.location="course.html?id="+id;

};



/* SEARCH */

document.getElementById("searchCourse").addEventListener("input",function(){

const val=this.value.toLowerCase();

document.querySelectorAll("#coursesGrid > div").forEach(card=>{

card.style.display=card.innerText.toLowerCase().includes(val)
? ""
: "none";

});

});



/* PASSWORD RESET */

document.getElementById("resetBtn").onclick=async()=>{

const user=auth.currentUser;

await sendPasswordResetEmail(auth,user.email);

alert("Reset link sent to "+user.email);

};



/* PROFILE UPDATE */

document.getElementById("saveProfile").onclick=async()=>{

const name=document.getElementById("editName").value;
const phone=document.getElementById("editPhone").value;

const user=auth.currentUser;

await updateDoc(doc(db,"users",user.uid),{

name,
phone

});

alert("Profile updated");

};



/* CERTIFICATES */

async function loadCertificates(){

const res=await fetch("/data/certificates.json");

const data=await res.json();

const user=auth.currentUser;

const list=document.getElementById("certList");

list.innerHTML="";

data.filter(c=>c.email===user.email)
.forEach(c=>{

list.innerHTML+=`

<div class="glass p-4 rounded-xl flex justify-between">

<span>${c.course}</span>

<a href="${c.url}" target="_blank"
class="bg-blue-600 px-4 py-2 rounded-lg">

Download

</a>

</div>

`;

});

}



/* BILLING */

async function loadInvoices(){

const res=await fetch("/data/bill.json");

const data=await res.json();

const user=auth.currentUser;

const list=document.getElementById("invoiceList");

list.innerHTML="";

data.filter(i=>i.email===user.email)
.forEach(i=>{

list.innerHTML+=`

<div class="glass p-4 rounded-xl flex justify-between">

<span>${i.course}</span>

<a href="${i.invoice}" target="_blank"
class="bg-green-600 px-4 py-2 rounded-lg">

Invoice

</a>

</div>

`;

});

}



/* LOGOUT */

document.getElementById("logoutBtn").onclick=async()=>{

await signOut(auth);

window.location="login.html";

};
