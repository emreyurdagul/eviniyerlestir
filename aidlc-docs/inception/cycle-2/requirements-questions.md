# Cycle 2 - Requirements Verification Questions

Yeni ozellik kapsamı: **Mobilya odaya sabitleme** + **AI ozellikleri**

Cevaplari `[Answer]:` etiketinin yanina yazin.

---

## Bolum A: Mobilya - Oda Sabitleme

### Question A1
Mobilya bir odaya sabitlendiginde davranis nasil olmali?

A) Sadece **mantiksal** bag - oda tasininca mobilyalar onunla tasinmaz, sadece "bu mobilya bu odaya ait" bilgisi tutulur (mevcut pinToRoom davranisi)
B) **Fiziksel** bag - oda tasininca/dondurulurken mobilyalar da birlikte hareket eder (group transformation)
C) **Hibrit** - varsayilan fiziksel, ama kullanici "kopar" diyebilir
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question A2
Mobilya odaya nasil sabitlenir?

A) **Otomatik** - mobilya bir odanin icinde olunca otomatik o odaya sabitlenir (raycast hit-test)
B) **Manuel** - properties panelden "Odaya Sabitle" butonu (mevcut)
C) **Her ikisi** - otomatik onerir, kullanici onaylar veya el ile degistirir
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question A3
Mobilya oda dışına surukleninirse ne olur?

A) **Engelle** - mobilya odanin disina cikamaz, sinira sabitlenir
B) **Uyari ver** - cikabilir ama kirmizi vurgulu, "bu mobilya hicbir odada degil" bildirimi
C) **Serbest** - cikabilir, sabitleme otomatik kalkar
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Bolum B: AI Ozellikleri

### Question B1
Hangi AI ozellikleri oncelikli? (birden fazla secebilirsiniz - virgulle ayirin)

A) **Akilli mobilya yerlestirme** - "salonum icin onerilen yerlesim" (oda boyutuna gore mobilya yerlerini AI onerir)
B) **Mobilya onerisi** - oda tipine gore eksik mobilya onerileri ("yatak odasinda gardrop yok, eklemek ister misin?")
C) **Doga sorgulu plan** - "100 m2 daire icin 3 oda 1 salon plani olustur" (text -> kat plani)
D) **Foto-to-3D model** - mobilya fotograf yukleyince yaklasik 3D model olusturma
E) **Stil danismani** - secilen mobilyalara gore renk paleti + dekoratif mobilya onerileri
X) Other (please describe after [Answer]: tag below)

[Answer]: Hepsi olacak ve bunun yanında krokiden yükleyip sistemde tüm kroki modelinin oluşmasını da sağlamam gerekli

---

### Question B2
AI servis tercihi?

A) **Anthropic Claude API** - kullanici kendi API key'ini girer (onerilir, en kaliteli sonuc)
B) **OpenAI GPT-4** - kullanici kendi API key'ini girer
C) **Yerel/Bedava** - tarayici icinde calisan basit kural-tabanli oneriler (API key gerekmez)
D) **Backend proxy** - bir backend kuracagiz (sonra), simdilik API key client'ta
X) Other (please describe after [Answer]: tag below)

[Answer]: D olacak ama şimdilik basit olması için clientta çalışacak

---

### Question B3
AI sonuclari nasil sunulmali?

A) **Direk uygula** - AI onerisi anlik 3D'ye yansir, kullanici Undo ile geri alabilir
B) **Onay iste** - AI onerisini onizlemede goster (yari saydam), kullanici "Uygula" derse ekler
C) **Liste sun** - AI birden fazla seçenek üretir, kullanici secer
X) Other (please describe after [Answer]: tag below)

[Answer]: C ve B karışık ai birden fazla öneri sunsun mu diye sorulsun

---

### Question B4
AI ozellikleri ne zaman tetiklenmeli?

A) **Manuel** - alt bardaki "AI Onerisi" butonuyla
B) **Otomatik** - oda eklenince/boyut degisince AI arka planda oneri sunar
C) **Her ikisi** - manuel buton var, ayrica oda olusurken oneri toast bildirimi
X) Other (please describe after [Answer]: tag below)

[Answer]:  A

---

## Bolum C: Genel

### Question C1
Cycle 2 kapsam onceligi?

A) Once **mobilya sabitleme** (kucuk, hizli), sonra AI
B) Once **AI ozellikleri** (proje diferansiyatori), sonra sabitleme
C) **Paralel** - ikisi de ayni ciklus icinde
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---
