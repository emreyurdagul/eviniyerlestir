# EviniYerlestir - Gereksinim Dogrulama Sorulari

Asagidaki sorulari cevaplayarak projenin gereksinimlerini netlestirmemize yardimci olun.
Her soru icin [Answer]: etiketinin yanina sectiginiz harfi yazin.

---

## Question 1
Uygulamanin birincil hedef kitlesi kimdir?

A) Ev sahibi bireyler (kendi evini planlamak isteyenler)
B) Ic mimarlar / dekoratörler (profesyonel kullanim)
C) Emlak sektoru (daire tanitimi, satis amaçli)
D) Hepsi - genel amacli ev planlama araci
X) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 2
Kat plani olusturma nasil calisacak?

A) Hazir oda sablonlari ekle + boyutlarini ayarla (mevcut prototipteki gibi)
B) Serbest cizim - duvarlari noktadan noktaya ciz, odalar otomatik olusun
C) Her ikisi de - basit mod (sablonlar) + gelismis mod (serbest cizim)
X) Other (please describe after [Answer]: tag below)

[Answer]: A ve B dahil bunun yanında da ileride plan üzerinden import ile oluşturma

---

## Question 3
Mobilya modelleri nasil gorunmeli?

A) Basit geometrik sekiller (kutular, silindirler - mevcut prototipteki gibi)
B) Daha detayli prosedural modeller (kenarlar yuvarlatilmis, doku eklenebilir)
C) Hazir GLTF/GLB 3D model dosyalari yuklenmeli (gercekci gorunum)
D) B + C karmasik: prosedural default modeller + kullanici kendi GLTF modellerini yukleyebilsin
X) Other (please describe after [Answer]: tag below)

[Answer]: B + C ve bunun yanında modelleri fotoğraf üzerinden de üretebiliyor olmalı ileride

---

## Question 4
2D kat plani gorunumu (top-view) ne kadar detayli olmali?

A) Basit top-view (mevcut 3D sahnenin ustten gorunumu yeterli)
B) Ayri bir 2D canvas (mimari cizim tarzi, olculu, yazili)
C) Her iki mod da - 3D perspektif + ayri 2D mimari gorunum
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 5
Kaydetme ve paylasim nasil calisacak?

A) Sadece JSON dosya export/import (mevcut gibi)
B) localStorage otomatik kayit + JSON export/import
C) B + link ile paylasim (URL'de encoded veri veya kisa link)
D) B + PNG/PDF export (gorsel cikti)
X) Other (please describe after [Answer]: tag below)

[Answer]: Hepsinin olması kullanıcıya mümkün mertebe çok fazla olanak sağlamak gerekli bu durumda

---

## Question 6
Coklu dil destegi gerekiyor mu?

A) Sadece Turkce
B) Turkce + Ingilizce (i18n destegi)
C) Turkce varsayilan, Ingilizce sonra eklenebilir (i18n altyapisi hazir olsun)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 7
Performans beklentileri nedir?

A) Masaustu tarayicilarda akici calissin yeterli
B) Mobil tarayicilarda da kullanilabilir olmali
C) Hem masaustu hem mobil, touch destegi ile
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 8
Oda icinde olcu gosterimi nasil olmali?

A) Sadece properties panelinde sayi olarak (mevcut gibi)
B) 3D sahnede duvar uzerinde olcu cizgileri ve yazilar
C) Her ikisi de - panel + 3D uzerinde olcu annotasyonlari
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 9: Security Extensions
Should security extension rules be enforced for this project?

A) Yes - enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No - skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes - enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial - enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No - skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---
