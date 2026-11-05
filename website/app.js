const captureCrops={"instance-082.png":{"w":1544,"h":1018,"x":0,"y":0,"cw":1544,"ch":1018},"mods-082.png":{"w":1536,"h":1024,"x":0,"y":1,"cw":1536,"ch":1004},"essentials-082.png":{"w":1542,"h":1020,"x":0,"y":0,"cw":1542,"ch":1020},"banner-082.png":{"w":1530,"h":1028,"x":28,"y":33,"cw":1475,"ch":947},"ingame-082.png":{"w":2550,"h":1436,"x":0,"y":0,"cw":2550,"ch":1436},"profile-082.png":{"w":1671,"h":941,"x":0,"y":0,"cw":1671,"ch":941}};
const cropStyle=(image)=>{const c=captureCrops[image];return c?`--capture-ratio:${c.cw/c.ch};--image-scale:${c.w/c.cw*100}%;--image-x:${-c.x/c.cw*100}%;--image-y:${-c.y/c.ch*100}%;`:'';};
const capture=(image,caption)=>`<figure class="product-capture"><button type="button" class="capture-enlarge" style="${cropStyle(image)}" data-enlarge aria-label="Screenshot vergrößern"><img src="/assets/${image}" alt="${caption}" loading="lazy"></button><figcaption>${caption}</figcaption><small class="image-disclosure">Einige Screenshots wurden mit KI bearbeitet, um persönliche Daten zu anonymisieren.</small></figure>`;
const featureContent = {
 instances:{breadcrumb:"BIBLIOTHEK / INSTANZEN",footer:"Eigene Minecraft-Versionen und getrennte Mods.",html:capture("instance-082.png","Echte Instanzansicht mit neutralen Beispieldaten.")},
 mods:{breadcrumb:"INHALTE / MODRINTH",footer:"Passend zu Minecraft-Version und Modloader.",html:capture("mods-082.png","Mods direkt im Launcher entdecken und installieren.")},
 essentials:{breadcrumb:"INSTANZEN / NIVO ESSENTIALS",footer:"Optionales Mod-Paket und eigene Mod-Presets.",html:capture("essentials-082.png","Nivo Essentials bei der Instanzerstellung auswählen.")},
 banners:{breadcrumb:"PROFIL / BANNER",footer:"Eigene Bilder hochladen. Andere Nivo-Spieler sehen dein Cape.",html:capture("banner-082.png","Lade dein eigenes Bild hoch und trage es als Cape. Alle anderen Spieler mit passendem Nivo Client sehen dein ausgewähltes Banner nach dem automatischen Profilabgleich.")},
 profile:{breadcrumb:"MINECRAFT / DEIN NAME",footer:"Name, Chat und Tab-Vorschau mit eigenen Farben.",html:capture("profile-082.png","Namensdesign mit Farbverlauf, Kontur und Schatten anpassen.")},
 ingame:{breadcrumb:"MINECRAFT / NIVO-MENÜ",footer:"Mit Right Shift öffnen. Fabric 26.3, 26.2 und 1.21.11.",html:capture("ingame-082.png","Das überarbeitete Nivo-Menü direkt im Spiel.")}
};

const tabs = [...document.querySelectorAll("[data-feature]")];
function setFeature(tab, focus = false) {
  const content = featureContent[tab.dataset.feature];
  if (!content) return;
  tabs.forEach((item) => {
    const selected = item === tab;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  document.querySelector("#panel-content").innerHTML = content.html;
  if (!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)
    document.querySelector("#panel-content").animate?.([{opacity:0,transform:"translateY(10px)"},{opacity:1,transform:"translateY(0)"}],{duration:280,easing:"ease-out"});
  document.querySelector("#panel-breadcrumb").textContent = content.breadcrumb;
  document.querySelector("#panel-footer-text").textContent = content.footer;
  document
    .querySelector("#feature-panel")
    .setAttribute("aria-labelledby", tab.id);
  if (focus) tab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => setFeature(tab));
  tab.addEventListener("keydown", (event) => {
    let target;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      target = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      target = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") target = 0;
    if (event.key === "End") target = tabs.length - 1;
    if (target !== undefined) {
      event.preventDefault();
      setFeature(tabs[target], true);
    }
  });
});
setFeature(tabs[0]);

const menu = document.querySelector(".menu-toggle");
const links = document.querySelector("#nav-links");
function closeMenu() {
  links.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Menü öffnen");
}
menu.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
});
document
  .querySelectorAll(".nav a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav")) closeMenu();
});

let release;
let pendingRelease;
let lastCheck = 0;
const checksum = document.querySelector("#checksum-value");
const copyButton = document.querySelector("#copy-checksum");
function refreshRelease() {
  if (pendingRelease) return pendingRelease;
  lastCheck = Date.now();
  release = undefined;
  copyButton.disabled = true;
  checksum.textContent = "Prüfsumme wird geladen …";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  pendingRelease = (async () => {
    try {
      const response = await fetch("/release.json", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Release-Information nicht erreichbar");
      const data = await response.json();
      if (
        !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(data.version) ||
        !/^\/downloads\/Nivo-Client-[A-Za-z0-9._-]+\.exe$/.test(data.file) ||
        !/^[a-f0-9]{64}$/.test(data.sha256) ||
        !Number.isSafeInteger(data.bytes) ||
        data.bytes <= 0
      )
        throw new Error("Ungültiger Release");
      release = data;
      const linuxDownloads = document.querySelector('.linux-downloads');
      if (linuxDownloads) {
        linuxDownloads.replaceChildren();
        const linux = Array.isArray(data.linux) ? data.linux : [];
        for (const artifact of linux) {
          const suffix = artifact.kind === 'deb' ? 'amd64.deb' : artifact.kind === 'appimage' ? 'x86_64.AppImage' : null;
          if (!suffix || artifact.file !== `/downloads/Nivo-Client-${data.version}-${suffix}`) continue;
          const link = document.createElement('a');
          link.href = artifact.file;
          link.textContent = artifact.kind === 'deb' ? 'Linux · Debian / Ubuntu (.deb)' : 'Linux · AppImage';
          linuxDownloads.append(link);
        }
        linuxDownloads.hidden = !linuxDownloads.children.length;
        if (!linuxDownloads.hidden) {
          const note = document.createElement('small');
          note.textContent = 'Linux-Beta · x86_64 · Ubuntu 22.04 / Debian 12 oder neuer';
          linuxDownloads.append(note);
        }
      }
      checksum.textContent = data.bootstrap?.sha256 ?? data.sha256;
      copyButton.disabled = false;
      document.querySelectorAll("[data-release-version]").forEach((node) => {
        node.textContent = data.version;
      });
      document.querySelector("#download-size").textContent =
        `${((data.bootstrap?.bytes ?? data.bytes) / 1024 / 1024).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB · Version ${data.version}`;
      const list = document.querySelector("#release-highlights");
      const highlights = Array.isArray(data.highlights)
        ? data.highlights
            .filter((text) => typeof text === "string" && text.length <= 180)
            .slice(0, 8)
        : [];
      list.replaceChildren(
        ...highlights.map((text) => {
          const item = document.createElement("li");
          item.textContent = text;
          return item;
        }),
      );
      list.parentElement.hidden = !highlights.length;
      const overview=document.querySelector("#latest-release-notes");
      if(overview)overview.replaceChildren(...highlights.map(text=>{const li=document.createElement("li");li.textContent=text;return li;}));
      const date=document.querySelector("#release-date");
      if(date&&data.publishedAt&&!Number.isNaN(Date.parse(data.publishedAt)))date.textContent=new Date(data.publishedAt).toLocaleDateString("de-DE",{day:"numeric",month:"long",year:"numeric"});
    } catch {
      checksum.textContent = "Prüfsumme momentan nicht verfügbar.";
    } finally {
      clearTimeout(timeout);
      pendingRelease = undefined;
    }
  })();
  return pendingRelease;
}
// Keep the stable URL even in tabs that stay open across a new deployment.
// Cloudflare serves this alias with no-store; metadata is refreshed separately.
for (const link of document.querySelectorAll("a[download]")) {
  link.href = "/downloads/Nivo-Client-Setup.exe";
  link.addEventListener("click", () => {
    void refreshRelease();
  });
}
const downloadNotice=document.querySelector('.download-notice');
let downloadTrigger, downloadPreviousOverflow='';
if(downloadNotice){
 document.querySelectorAll('a[download]').forEach(link=>link.addEventListener('click',()=>{
  if(typeof downloadNotice.showModal!=='function')return;
  if(downloadNotice.open)return;
  downloadTrigger=link;downloadPreviousOverflow=document.body.style.overflow;
  downloadNotice.showModal();document.body.style.overflow='hidden';
 }));
 const closeDownload=()=>downloadNotice.close();
 downloadNotice.querySelector('.download-notice-close').addEventListener('click',closeDownload);
 downloadNotice.querySelector('.download-notice-cancel').addEventListener('click',closeDownload);
 downloadNotice.addEventListener('click',event=>{if(event.target===downloadNotice)closeDownload();});
 downloadNotice.addEventListener('close',()=>{document.body.style.overflow=downloadPreviousOverflow;downloadTrigger?.focus({preventScroll:true});});
}
window.addEventListener("focus", () => {
  if (Date.now() - lastCheck > 30000) void refreshRelease();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && Date.now() - lastCheck > 30000) void refreshRelease();
});
void refreshRelease();
copyButton.addEventListener("click", async () => {
  const status = document.querySelector("#copy-status");
  if (!release) {
    status.textContent = "Prüfsumme wird noch geladen.";
    return;
  }
  try {
    await navigator.clipboard.writeText(release.bootstrap?.sha256 ?? release.sha256);
    status.textContent = "Prüfsumme kopiert.";
  } catch {
    status.textContent =
      "Bitte die angezeigte Prüfsumme markieren und kopieren.";
  }
});

if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('reveal-visible');observer.unobserve(entry.target);}},{threshold:.08});
 document.querySelectorAll('.feature-section,.community,.development,#download,.intro-strip,.faq,.why-section,.identity-section,.versions-section').forEach(el=>{el.classList.add('reveal-ready');observer.observe(el);});
}

const navShell=document.querySelector('.nav-shell');
if(navShell){
  const syncNav=()=>navShell.classList.toggle('is-solid', window.scrollY>24);
  syncNav();
  window.addEventListener('scroll', syncNav, {passive:true});
}

// Same-page enlargement: no new browser tab and no download navigation.
const lightbox=document.querySelector('.screenshot-lightbox');
let screenshotTrigger;
let lightboxScrollY=0;
document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-enlarge]');
 if(!trigger||!lightbox)return;
 event.preventDefault();
 const source=trigger.querySelector('img');if(!source)return;
 screenshotTrigger=trigger;
 lightboxScrollY=window.scrollY;
 const frame=lightbox.querySelector('.lightbox-capture');
 frame.style.cssText=trigger.style.cssText;
 if(!frame.style.getPropertyValue('--capture-ratio'))frame.style.setProperty('--capture-ratio',String(source.naturalWidth/source.naturalHeight||1.5));
 lightbox.querySelector('img').src=source.src;
 lightbox.querySelector('img').alt=source.alt;
 lightbox.querySelector('p').textContent=source.alt;
 lightbox.showModal();
 document.body.style.overflow='hidden';
 document.body.style.position='fixed';
 document.body.style.top=`-${lightboxScrollY}px`;
 document.body.style.left='0';
 document.body.style.right='0';
});
lightbox?.querySelector('.lightbox-close').addEventListener('click',()=>lightbox.close());
lightbox?.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close();});
lightbox?.addEventListener('close',()=>{
 document.body.style.overflow='';
 document.body.style.position='';
 document.body.style.top='';
 document.body.style.left='';
 document.body.style.right='';
 window.scrollTo(0,lightboxScrollY);
 screenshotTrigger?.focus({preventScroll:true});
});

// Soft accordion open/close for FAQ + checksum (keeps native <details> working).
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".faq-list details, details.checksum").forEach((details) => {
    const body = details.querySelector(".details-body");
    if (!body) return;
    let animating = false;

    details.addEventListener("click", (event) => {
      const summary = event.target.closest("summary");
      if (!summary || !details.contains(summary) || summary.parentElement !== details) return;
      if (reduceMotion || animating) return;
      event.preventDefault();
      animating = true;

      if (details.open) {
        body.style.gridTemplateRows = "1fr";
        void body.offsetHeight;
        body.style.gridTemplateRows = "0fr";
        window.setTimeout(() => {
          details.removeAttribute("open");
          body.style.gridTemplateRows = "";
          animating = false;
        }, 280);
        return;
      }

      details.setAttribute("open", "");
      body.style.gridTemplateRows = "0fr";
      void body.offsetHeight;
      body.style.gridTemplateRows = "1fr";
      window.setTimeout(() => {
        body.style.gridTemplateRows = "";
        animating = false;
      }, 280);
    });
  });
})();

// Aggregate counters only: no cookies, visitor IDs, page URLs or account data.
const countSiteEvent=event=>{if(navigator.doNotTrack==='1')return;void fetch('https://nivo-api.jonasneubauer94.workers.dev/collect',{method:'POST',credentials:'omit',headers:{'Content-Type':'text/plain'},body:JSON.stringify({event}),keepalive:true}).catch(()=>{});};
countSiteEvent('pageview');
document.addEventListener('click',event=>{const link=event.target.closest('a');if(!link||event.defaultPrevented)return;if(link.hasAttribute('download')||link.closest('.linux-downloads'))countSiteEvent('download');else if(/^https:\/\/(discord.gg|discord.com)\//.test(link.href))countSiteEvent('discord');});
