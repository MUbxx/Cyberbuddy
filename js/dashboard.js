import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc,
setDoc,
onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
onAuthStateChanged,
signOut,
sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


/* DOM */

const coursesGrid = document.getElementById("coursesGrid");
const myCoursesGrid = document.getElementById("myCoursesGrid");

const certList = document.getElementById("certList");
const invoiceList = document.getElementById("invoiceList");

const logoutBtn = document.getElementById("logoutBtn");
const resetBtn = document.getElementById("resetBtn");

const editName = document.getElementById("editName");
const editPhone = document.getElementById("editPhone");

const profilePhoto = document.getElementById("profilePhoto");
const photoUpload = document.getElementById("photoUpload");

const profileName = document.getElementById("profileName");
const profileEmailDisplay = document.getElementById("profileEmailDisplay");

const statCourses = document.getElementById("statCourses");
const statCertificates = document.getElementById("statCertificates");

const searchInput = document.getElementById("searchCourse");

let userData = null;
let allCourses = [];


/* ==========================
AUTH CHECK
========================== */

onAuthStateChanged(auth, async (user) => {

if (!user) {
window.location = "login.html";
return;
}

/* load photo instantly from local storage */

const savedPhoto = localStorage.getItem("profilePhoto");

if(savedPhoto){
profilePhoto.src = savedPhoto;
}

loadCertificates(user);
loadInvoices(user);

const userRef = doc(db, "users", user.uid);

onSnapshot(userRef, (snap) => {

userData = snap.data();

if(userData){

loadProfile(user);
loadCourses();

}

});

});


/* ==========================
LOAD PROFILE
========================== */

function loadProfile(user){

profileName.innerText = userData.name || "Student";
profileEmailDisplay.innerText = user.email;

editName.value = userData.name || "";
editPhone.value = userData.phone || "";

if(userData.photo){
profilePhoto.src = userData.photo;

/* save locally */

localStorage.setItem("profilePhoto", userData.photo);
}

}


/* ==========================
PROFILE PHOTO UPLOAD
========================== */

if(photoUpload){

photoUpload.addEventListener("change", async function(){

const file = this.files[0];

if(!file) return;

/* compress image */

const reader = new FileReader();

reader.onload = async function(){

const base64 = reader.result;

/* preview instantly */

profilePhoto.src = base64;

/* store locally */

localStorage.setItem("profilePhoto", base64);

const user = auth.currentUser;

try{

await setDoc(
doc(db,"users",user.uid),
{ photo: base64 },
{ merge:true }
);

alert("Profile photo updated");

}catch(err){

console.error(err);
alert("Failed to upload profile");

}

};

reader.readAsDataURL(file);

});

}


/* ==========================
UPDATE PHONE NUMBER
========================== */

document.getElementById("saveProfile").onclick = async () => {

const phone = editPhone.value;
const user = auth.currentUser;

await setDoc(
doc(db,"users",user.uid),
{ phone: phone },
{ merge:true }
);

alert("Profile updated");

};


/* ==========================
LOAD COURSES
========================== */

async function loadCourses(){

coursesGrid.innerHTML = "";
myCoursesGrid.innerHTML = "";

const coursesSnap = await getDocs(collection(db,"courses"));

allCourses = [];

coursesSnap.forEach(course=>{

const data = course.data();
const courseId = course.id;

allCourses.push({id:courseId,...data});

const access = userData.purchasedCourses && userData.purchasedCourses.includes(courseId);

const card = createCourseCard(courseId,data,access);

coursesGrid.innerHTML += card;

if(access){
myCoursesGrid.innerHTML += card;
}

});

statCourses.innerText = userData.purchasedCourses ? userData.purchasedCourses.length : 0;

}


/* ==========================
COURSE CARD
========================== */

function createCourseCard(courseId,data,access){

const img = data.image || data.thumbnail || "https://via.placeholder.com/400x200";

return `

<div class="glass rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-400 transition">

<img src="${img}" class="w-full h-40 object-cover">

<div class="p-5">

<h3 class="font-bold text-lg mb-2">${data.title}</h3>

<p class="text-sm text-slate-400 mb-4">${data.description || ""}</p>

${access ?

`<a href="course.html?id=${courseId}" class="bg-cyan-400 text-black px-4 py-2 rounded-lg text-sm font-bold block text-center">
Start Learning
</a>`

:

`<button class="w-full bg-slate-700 px-4 py-2 rounded-lg text-sm text-slate-400">
Locked
</button>`

}

</div>
</div>

`;

}


/* ==========================
COURSE SEARCH
========================== */

if(searchInput){

searchInput.addEventListener("input",()=>{

const query = searchInput.value.toLowerCase();

coursesGrid.innerHTML = "";

allCourses.forEach(course=>{

if(course.title.toLowerCase().includes(query)){

const access = userData.purchasedCourses && userData.purchasedCourses.includes(course.id);

coursesGrid.innerHTML += createCourseCard(course.id,course,access);

}

});

});

}


/* ==========================
CERTIFICATES
========================== */

async function loadCertificates(user){

if(!certList) return;

try{

const res = await fetch("https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/certificates.json");

const data = await res.json();

const userCerts = data.certificates.filter(cert =>
cert.email && cert.email.toLowerCase() === user.email.toLowerCase()
);

certList.innerHTML = "";

userCerts.forEach(cert=>{

certList.innerHTML += `
<div class="glass p-5 rounded-xl flex justify-between items-center">

<div>
<h4 class="font-bold text-blue-400">${cert.course}</h4>
<p class="text-xs text-slate-400">${cert.type} • ${cert.duration}</p>
</div>

<a href="verify-certificate.html?id=${cert.certId}"
class="bg-blue-600 px-4 py-2 rounded-lg text-xs">
View
</a>

</div>
`;

});

statCertificates.innerText = userCerts.length;

}catch(e){
console.error(e);
}

}


/* ==========================
BILLING
========================== */

async function loadInvoices(user){

if(!invoiceList) return;

try{

const res = await fetch("https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/bills.json");

const bills = await res.json();

const userBills = bills.filter(bill =>
bill.email && bill.email.toLowerCase() === user.email.toLowerCase()
);

invoiceList.innerHTML = "";

userBills.forEach(bill=>{

invoiceList.innerHTML += `
<div class="glass p-5 rounded-xl flex justify-between items-center">

<div>
<h4 class="font-bold text-green-400">${bill.course}</h4>
<p class="text-xs text-slate-400">₹${bill.amount} • ${bill.date}</p>
</div>

<a href="${bill.verifyUrl}" target="_blank"
class="bg-slate-800 px-4 py-2 rounded-lg text-xs">
Verify
</a>

</div>
`;

});

}catch(e){
console.error(e);
}

}


/* ==========================
PASSWORD RESET
========================== */

if(resetBtn){

resetBtn.onclick = async ()=>{

const user = auth.currentUser;

await sendPasswordResetEmail(auth,user.email);

alert("Password reset email sent");

};

}


/* ==========================
LOGOUT
========================== */

logoutBtn.onclick = async ()=>{

await signOut(auth);

window.location = "login.html";

};
