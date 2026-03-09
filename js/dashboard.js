import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
onSnapshot,
updateDoc
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
onAuthStateChanged,
signOut,
sendPasswordResetEmail
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


/* DOM */

const coursesGrid = document.getElementById("coursesGrid");
const myCoursesGrid = document.getElementById("myCoursesGrid");

const certList = document.getElementById("certList");
const invoiceList = document.getElementById("invoiceList");

const logoutBtn = document.getElementById("logoutBtn");
const resetBtn = document.getElementById("resetBtn");

const editName = document.getElementById("editName");
const editPhone = document.getElementById("editPhone");
const editPhoto = document.getElementById("editPhoto");

const profileNameDisplay = document.getElementById("profileNameDisplay");
const profileEmailDisplay = document.getElementById("profileEmailDisplay");
const profilePhoto = document.getElementById("profilePhoto");

const statCourses = document.getElementById("statCourses");
const statCertificates = document.getElementById("statCertificates");

const searchInput = document.getElementById("searchCourse");

let userData = null;
let allCourses = [];


/* ===============================
AUTH CHECK
================================ */

onAuthStateChanged(auth, (user) => {

if(!user){
window.location="login.html";
return;
}

if(profileEmailDisplay){
profileEmailDisplay.innerText = user.email;
}

const userRef = doc(db,"users",user.uid);

/* listen for user document */

onSnapshot(userRef,(snap)=>{

userData = snap.data();

if(!userData) return;

/* profile fields */

editName.value = userData.name || "";
editPhone.value = userData.phone || "";
editPhoto.value = userData.photoURL || "";

if(profileNameDisplay){
profileNameDisplay.innerText = userData.name || "Student";
}

if(profilePhoto && userData.photoURL){
profilePhoto.src = userData.photoURL;
}

/* LOAD DATA AFTER USER READY */

loadCourses();
loadCertificates(user);
loadInvoices(user);

});

});


/* ===============================
LOAD COURSES
================================ */

async function loadCourses(){

coursesGrid.innerHTML="";
myCoursesGrid.innerHTML="";

try{

const snap = await getDocs(collection(db,"courses"));

allCourses=[];

snap.forEach(c=>{

const data = c.data();
const id = c.id;

allCourses.push({id,...data});

const access = userData?.purchasedCourses?.includes(id);

const card = createCourseCard(id,data,access);

coursesGrid.innerHTML += card;

if(access){
myCoursesGrid.innerHTML += card;
}

});

statCourses.innerText = userData?.purchasedCourses?.length || 0;

}catch(e){
console.error("Course load error:",e);
}

}


/* ===============================
COURSE CARD
================================ */

function createCourseCard(id,data,access){

const img = data.image || data.thumbnail || "https://via.placeholder.com/400x200";

return `
<div class="glass rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-400 transition">

<img src="${img}" class="w-full h-40 object-cover">

<div class="p-5">

<h3 class="font-bold text-lg mb-2">${data.title || id}</h3>

<p class="text-sm text-slate-400 mb-4">
${data.description || ""}
</p>

${access
? `<a href="course.html?id=${id}"
class="bg-cyan-400 text-black px-4 py-2 rounded-lg text-sm font-bold block text-center">
Start Learning
</a>`
: `<button class="w-full bg-slate-700 px-4 py-2 rounded-lg text-sm text-slate-400">
Locked
</button>`
}

</div>
</div>
`;
}


/* ===============================
SEARCH
================================ */

if(searchInput){

searchInput.addEventListener("input",()=>{

const q = searchInput.value.toLowerCase();

coursesGrid.innerHTML="";

allCourses.forEach(c=>{

if((c.title || "").toLowerCase().includes(q)){

const access = userData?.purchasedCourses?.includes(c.id);

coursesGrid.innerHTML += createCourseCard(c.id,c,access);

}

});

});

}


/* ===============================
CERTIFICATES
================================ */

async function loadCertificates(user){

if(!user?.email) return;

certList.innerHTML="Loading certificates...";

try{

const res = await fetch("https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/certificates.json");
const data = await res.json();

const list = (data.certificates || []).filter(c=>

(c.email || "").toLowerCase().trim()
=== user.email.toLowerCase().trim()

);

certList.innerHTML="";

if(list.length===0){
certList.innerHTML="No certificates found";
return;
}

list.forEach(cert=>{

certList.innerHTML += `
<div class="glass p-5 rounded-xl flex justify-between items-center mb-3">

<div>
<h4 class="font-bold text-blue-400">${cert.course}</h4>
<p class="text-xs text-slate-400">${cert.type} • ${cert.duration}</p>
</div>

<a href="https://mubyyy404.github.io/Cyber-Buddy/verify-certificate.html?id=${cert.certId}"
class="bg-blue-600 px-4 py-2 rounded-lg text-xs">
View
</a>

</div>
`;

});

statCertificates.innerText = list.length;

}catch(e){

console.error("Certificate error:",e);

certList.innerHTML="Certificate loading error";

}

}


/* ===============================
BILLING
================================ */

async function loadInvoices(user){

if(!user?.email) return;

invoiceList.innerHTML="Loading billing...";

try{

const res = await fetch("https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/bills.json");
const bills = await res.json();

const list = (bills || []).filter(b=>

(b.email || "").toLowerCase().trim()
=== user.email.toLowerCase().trim()

);

invoiceList.innerHTML="";

if(list.length===0){
invoiceList.innerHTML="No billing history found";
return;
}

list.forEach(b=>{

invoiceList.innerHTML += `
<div class="glass p-5 rounded-xl flex justify-between items-center mb-3">

<div>
<h4 class="font-bold text-green-400">${b.course}</h4>
<p class="text-xs text-slate-400">₹${b.amount} • ${b.date}</p>
</div>

<a href="${b.verifyUrl}" target="_blank"
class="bg-slate-800 px-4 py-2 rounded-lg text-xs">
Verify
</a>

</div>
`;

});

}catch(e){

console.error("Billing error:",e);

invoiceList.innerHTML="Billing loading error";

}

}


/* ===============================
PROFILE UPDATE
================================ */

document.getElementById("saveProfile").onclick = async ()=>{

const user = auth.currentUser;

try{

await updateDoc(doc(db,"users",user.uid),{
name:editName.value,
phone:editPhone.value,
photoURL:editPhoto.value
});

alert("Profile updated");

}catch(e){

console.error("Profile update error:",e);

alert("Failed to update profile");

}

};


/* ===============================
PASSWORD RESET
================================ */

if(resetBtn){

resetBtn.onclick = async ()=>{

const user = auth.currentUser;

await sendPasswordResetEmail(auth,user.email);

alert("Password reset email sent");

};

}


/* ===============================
LOGOUT
================================ */

logoutBtn.onclick = async ()=>{

await signOut(auth);

window.location="login.html";

};


/* ===============================
SIDEBAR
================================ */

document.getElementById("toggleSidebar").onclick = ()=>{

document.getElementById("sidebar").classList.toggle("collapsed");

};


/* ===============================
TABS
================================ */

document.querySelectorAll(".navBtn").forEach(btn=>{

btn.onclick=()=>{

document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));

document.getElementById(btn.dataset.tab).classList.add("active");

};

});
