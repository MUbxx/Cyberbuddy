import { auth, db } from "./firebase.js";
import {
    collection,
    getDocs,
    doc,
    onSnapshot,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* DOM Elements */
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

/* ===============================
   AUTH CHECK & REAL-TIME DATA
================================ */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location = "login.html";
        return;
    }

    // Display email immediately
    if (profileEmailDisplay) profileEmailDisplay.innerText = user.email;

    const userRef = doc(db, "users", user.uid);

    // Real-time listener for user profile and course access
    onSnapshot(userRef, (snap) => {
        userData = snap.data();
        if (!userData) return;

        // Update Profile UI
        if (editName) editName.value = userData.name || "";
        if (editPhone) editPhone.value = userData.phone || "";
        if (profileName) profileName.innerText = userData.name || "Student";
        
        // Handle Profile Photo (Database URL or Base64)
        if (profilePhoto && userData.photo) {
            profilePhoto.src = userData.photo;
        }

        // Trigger Data Loads
        loadCourses(); 
        loadCertificates(user);
        loadInvoices(user);
    });
});

/* ===============================
   LOAD COURSES
================================ */
async function loadCourses() {
    if (!coursesGrid || !myCoursesGrid) return;
    
    coursesGrid.innerHTML = "<p class='p-5 text-slate-500'>Loading Available Courses...</p>";
    myCoursesGrid.innerHTML = "";

    try {
        const snap = await getDocs(collection(db, "courses"));
        allCourses = [];
        coursesGrid.innerHTML = "";

        snap.forEach(c => {
            const data = c.data();
            const id = c.id;
            allCourses.push({ id, ...data });

            const access = userData?.purchasedCourses?.includes(id);
            const card = createCourseCard(id, data, access);

            coursesGrid.innerHTML += card;
            if (access) {
                myCoursesGrid.innerHTML += card;
            }
        });

        if (statCourses) statCourses.innerText = userData?.purchasedCourses?.length || 0;
        
        if (myCoursesGrid.innerHTML === "") {
            myCoursesGrid.innerHTML = "<p class='p-5 text-slate-500'>No courses enrolled yet.</p>";
        }
    } catch (e) {
        console.error("Course load error:", e);
    }
}

function createCourseCard(id, data, access) {
    const img = data.thumbnail || data.image || "https://via.placeholder.com/400x200";
    return `
    <div class="glass rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-400 transition card-hover">
        <img src="${img}" class="w-full h-40 object-cover">
        <div class="p-5">
            <h3 class="font-bold text-lg mb-2">${data.title || id}</h3>
            <p class="text-sm text-slate-400 mb-4 line-clamp-2">${data.description || ""}</p>
            ${access 
                ? `<a href="course.html?id=${id}" class="bg-cyan-400 text-black px-4 py-2 rounded-lg text-sm font-bold block text-center">Start Learning</a>` 
                : `<button class="w-full bg-slate-700 px-4 py-2 rounded-lg text-sm text-slate-400">Locked</button>`
            }
        </div>
    </div>`;
}

/* ===============================
   PHOTO UPLOAD (BASE64)
================================ */
if (photoUpload) {
    photoUpload.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function () {
            const base64 = reader.result;
            if (profilePhoto) profilePhoto.src = base64; // Instant Preview

            try {
                await updateDoc(doc(db, "users", auth.currentUser.uid), { photo: base64 });
                alert("Profile photo updated!");
            } catch (e) {
                alert("Failed to save photo.");
            }
        };
        reader.readAsDataURL(file);
    });
}

/* ===============================
   SEARCH & TABS & OTHERS
================================ */
if (searchInput) {
    searchInput.addEventListener("input", () => {
        const q = searchInput.value.toLowerCase();
        coursesGrid.innerHTML = "";
        allCourses.forEach(c => {
            if ((c.title || "").toLowerCase().includes(q)) {
                const access = userData?.purchasedCourses?.includes(c.id);
                coursesGrid.innerHTML += createCourseCard(c.id, c, access);
            }
        });
    });
}

async function loadCertificates(user) {
    if (!certList) return;
    try {
        const res = await fetch("https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/certificates.json");
        const data = await res.json();
        const list = (data.certificates || []).filter(c => c.email?.toLowerCase().trim() === user.email.toLowerCase().trim());
        certList.innerHTML = list.length ? "" : "No certificates found";
        list.forEach(cert => {
            certList.innerHTML += `
            <div class="glass p-5 rounded-xl flex justify-between items-center mb-3">
                <div>
                    <h4 class="font-bold text-blue-400">${cert.course}</h4>
                    <p class="text-xs text-slate-400">${cert.type}</p>
                </div>
                <a href="https://mubyyy404.github.io/Cyber-Buddy/verify-certificate.html?id=${cert.certId}" class="bg-blue-600 px-4 py-2 rounded-lg text-xs">View</a>
            </div>`;
        });
        if (statCertificates) statCertificates.innerText = list.length;
    } catch (e) { certList.innerHTML = "Error loading certificates"; }
}

async function loadInvoices(user) {
    if (!invoiceList) return;
    try {
        const res = await fetch("https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/bills.json");
        const bills = await res.json();
        const list = (bills || []).filter(b => b.email?.toLowerCase().trim() === user.email.toLowerCase().trim());
        invoiceList.innerHTML = list.length ? "" : "No billing history";
        list.forEach(b => {
            invoiceList.innerHTML += `<div class="glass p-5 rounded-xl flex justify-between items-center mb-3"><div><h4 class="font-bold text-green-400">${b.course}</h4><p class="text-xs text-slate-400">₹${b.amount} • ${b.date}</p></div><a href="${b.verifyUrl}" target="_blank" class="bg-slate-800 px-4 py-2 rounded-lg text-xs">Verify</a></div>`;
        });
    } catch (e) { invoiceList.innerHTML = "Error loading billing"; }
}

document.getElementById("saveProfile").onclick = async () => {
    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { phone: editPhone.value });
        alert("Profile updated!");
    } catch (e) { alert("Failed to update profile."); }
};

if (resetBtn) resetBtn.onclick = async () => { await sendPasswordResetEmail(auth, auth.currentUser.email); alert("Reset link sent!"); };
logoutBtn.onclick = async () => { await signOut(auth); window.location = "login.html"; };
