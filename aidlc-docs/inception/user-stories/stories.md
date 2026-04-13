# EviniYerlestir - User Stories

## Organizasyon: Feature-Based (Epic → Story)
## Granularite: Orta (alt ozellik basina 1 hikaye)
## Kabul Kriterleri: Detayli (4-6 madde)

---

# Epic 1: Kat Plani Olusturma

## US-1.1: Sablondan Oda Ekleme
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, hazir oda sablonlarindan (salon, yatak odasi, mutfak, banyo, koridor, cocuk odasi) secip sahneye eklemek istiyorum, boylece hizlica kat plani olusturabilirim.

**Kabul Kriterleri**:
- [ ] Sol paneldeki oda katalogundan bir oda tipine tiklandiginda 3D sahneye oda eklenir
- [ ] Oda varsayilan boyutlarla (cm) olusturulur
- [ ] Eklenen oda sahnenin merkezine yakin konumlanir
- [ ] Oda eklendiginde otomatik secili hale gelir ve highlight gosterilir
- [ ] Sag panelde oda ozellikleri (boyut, tip) goruntulenir

## US-1.2: Oda Boyutlandirma
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, oda boyutlarini (en ve boy) hem input alanlarindan hem de fare/parmak hareketleriyle ayarlamak istiyorum, boylece gercek odamla ayni olculere hizlica getirebilirim.

**Kabul Kriterleri**:
- [ ] Properties panelinde en ve boy input alanlari gorunur (sayisal giris)
- [ ] Oda kenarlarina fare/parmak ile tutup surukleyerek boyutlandirma yapilabilir (handle-based resize)
- [ ] Deger degistirildiginde 3D model anlik olarak guncellenir
- [ ] Minimum 20cm, maksimum 5000cm sinir uygulanir (tuvalet/havalandirma boslugu ~ 20cm, buyuk salon ~ 50m)
- [ ] Gecersiz deger girildiginde onceki degere geri doner
- [ ] Boyut degisikligi icindeki mobilyalari etkilemez (pozisyonlari korunur)

## US-1.3: Oda Konumlandirma
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, odalari surukleyerek istedigim konuma tasimak istiyorum, boylece kat planimdaki gercek yerlesimi yansitabilirim.

**Kabul Kriterleri**:
- [ ] Odaya tiklanip suruklendiginde zemin duzleminde hareket eder
- [ ] Surekleme sirasinda cursor "grabbing" olarak degisir
- [ ] Oda birakildiginda son konumda kalir
- [ ] Odanin icindeki mobilyalar odayla birlikte hareket eder (ileride)

## US-1.4: Oda Dondurme
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, odayi 90 derece dondurerek farkli yonelimler denemek istiyorum.

**Kabul Kriterleri**:
- [ ] Oda seciliyken "Dondur" butonuna tiklandiginda 90 derece doner
- [ ] Dondurme animasyonsuz anlik gerceklesir
- [ ] Dondurme sonrasi oda icindeki mobilyalar da doner (ileride)
- [ ] Ardisik tiklamalarda 90-180-270-360 seklinde doner

## US-1.5: Oda Silme
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, yanlis ekledigim odayi silebilmek istiyorum.

**Kabul Kriterleri**:
- [ ] Her oda yaninda "X" silme butonu bulunur
- [ ] Tiklandiginda oda sahneden kaldirilir
- [ ] Silinen oda listeden de kalkar
- [ ] Secili oda silinirse secim sifirlanir

---

# Epic 2: Mobilya Yerlestirme

## US-2.1: Mobilya Ekleme
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, mobilya katalogundan (koltuk, yatak, masa, dolap vb.) secip sahneye eklemek istiyorum, boylece odalari doserim.

**Kabul Kriterleri**:
- [ ] Sol paneldeki "Mobilya" tabindan mobilya tipine tiklandiginda sahneye eklenir
- [ ] 12+ mobilya tipi mevcut (koltuk, tekli, sandalye, sehpa, TV unitesi, masa, yatak, dolap, raf, lambader, hali, bitki)
- [ ] Mobilya varsayilan boyutlarla olusturulur
- [ ] Eklenen mobilya otomatik secili olur
- [ ] Her mobilya tipi kendine ozgu 3D modele sahiptir

## US-2.2: Mobilya Surekleme
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, mobilyalari surukleyerek oda icinde istedigim yere yerlestirmek istiyorum.

**Kabul Kriterleri**:
- [ ] Mobilyaya tiklanip suruklendiginde zemin duzleminde hareket eder
- [ ] Surekleme sirasinda diger nesnelerin ustunden gecebilir (clipping yok)
- [ ] Surekleme birakildiktan sonra pozisyon korunur
- [ ] Touch cihazlarda tek parmak surekleme desteklenir

## US-2.3: Mobilya Boyutlandirma
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, mobilya boyutlarini fare/parmak hareketleriyle (handle surekleme) ve istege bagli olarak sayisal inputlarla ayarlamak istiyorum, boylece hizlica ve sezgisel sekilde gercek mobilyamla ayni olculere getirebilirim.

**Kabul Kriterleri**:
- [ ] Mobilya secildiginde kenarlarinda/koselerinde boyutlandirma handle'lari gosterilir
- [ ] Handle'lara fare/parmakla tutup surukleyerek boyut degistirilir (birincil etkilesim)
- [ ] Properties panelinde sayisal input alanlari da bulunur (opsiyonel hassas ayar)
- [ ] Deger degistirildiginde 3D model anlik guncellenir
- [ ] Her boyut parametresi icin min/max sinirlar uygulanir
- [ ] Boyut degisikligi modelin orantisini korur

## US-2.4: Mobilya Dondurme
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, mobilyayi 90 derece dondurerek farkli yonelimler denemek istiyorum.

**Kabul Kriterleri**:
- [ ] Mobilya seciliyken "Dondur" butonuna tiklandiginda 90 derece doner
- [ ] Dondurme modelin 3D gorunumunu gunceller
- [ ] Ardisik tiklamalarda tam tur doner
- [ ] Dondurme mobilyanin pozisyonunu degistirmez

## US-2.5: Mobilya Silme
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, istemedigim mobilyayi sahneden kaldirmak istiyorum.

**Kabul Kriterleri**:
- [ ] Her mobilya yaninda "X" silme butonu bulunur
- [ ] Tiklandiginda mobilya sahneden ve listeden kaldirilir
- [ ] Secili mobilya silinirse secim sifirlanir
- [ ] Silme islemi geri alinamaz (Faz 1; Faz 2'de undo eklenecek)

---

# Epic 3: Gorunum ve Navigasyon

## US-3.1: 3D Perspektif Gorunum
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, kat planimi 3D perspektifte gorup fareyle dondurerek her acidan incelemek istiyorum.

**Kabul Kriterleri**:
- [ ] Varsayilan gorunum 3D perspektif (acili kamera)
- [ ] Bos alana tikla-surukle ile kamera orbit rotasyonu
- [ ] Mouse wheel ile zoom in/out
- [ ] Kamera sinirlar dahilinde hareket eder (yerin altina veya cok uzaga gitmez)
- [ ] Touch: iki parmak ile dondurme ve pinch-zoom

## US-3.2: Ust Gorunum (Top-View)
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, kat planima ustten bakarak genel yerlesimi gormek istiyorum.

**Kabul Kriterleri**:
- [ ] Alt bardaki "Ustten" butonuna tiklandiginda kamera tam yukaridan bakar
- [ ] Tekrar tiklandiginda 3D perspektife doner
- [ ] Ust gorunumde tum odalar ve mobilyalar gorulur
- [ ] Ust gorunumde surekleme ve zoom hala calisir

## US-3.3: Nesne Secimi
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, bir oda veya mobilyaya tiklayarak secmek ve ozelliklerini gormek istiyorum.

**Kabul Kriterleri**:
- [ ] Nesneye tiklandiginda wireframe highlight gosterilir
- [ ] Secili nesnenin ozellikleri sag panelde goruntulenir
- [ ] Alt barda secim badge'i gosterilir (ikon + isim + "secili")
- [ ] Bos alana tiklandiginda secim kalkar
- [ ] Ayni anda sadece 1 nesne secili olabilir

---

# Epic 4: Kaydetme ve Yukleme

## US-4.1: Otomatik Kayit (localStorage)
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, calismaMin otomatik kaydedilmesini istiyorum, boylece tarayiciyi kapatip actigimda kaldigi yerden devam edebilirim.

**Kabul Kriterleri**:
- [ ] Her degisiklikte (ekle, sil, tasi, boyutlandir) layout localStorage'a kaydedilir
- [ ] Sayfa yuklendiginde onceki layout otomatik yuklenir
- [ ] Bos sahne icin localStorage'da veri olmaz
- [ ] Hatali localStorage verisi durumunda bos sahne acilir (crash olmaz)

## US-4.2: JSON Export
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, kat planimi JSON dosya olarak indirmek istiyorum, boylece yedekleyebilir veya baska cihazda acabilirim.

**Kabul Kriterleri**:
- [ ] "Kaydet" butonuna tiklandiginda .json dosya indirilir
- [ ] Dosya adi "eviniyerlestir-plan.json" olarak ayarlanir
- [ ] JSON icinde tum odalar ve mobilyalar (tip, pozisyon, rotasyon, boyutlar) bulunur
- [ ] Dosya boyutu tipik bir plan icin 10KB'dan kucuk olur

## US-4.3: JSON Import
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, onceden kaydedigim JSON dosyayi yukleyerek planimi geri getirmek istiyorum.

**Kabul Kriterleri**:
- [ ] "Yukle" butonuna tiklandiginda dosya secim dialogu acilir
- [ ] Gecerli JSON yuklediginde sahne tamamen yeniden olusturulur
- [ ] Gecersiz dosya formatinda kullaniciya hata mesaji gosterilir
- [ ] JSON schema dogrulamasi yapilir (guvenlik - NFR-05)
- [ ] Mevcut sahne yukleme sonrasi temizlenir

---

# Epic 5: Kullanici Arayuzu

## US-5.1: Sol Panel (Katalog)
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, sol panelden oda ve mobilya kataloguna erisip istedigimi eklemek istiyorum.

**Kabul Kriterleri**:
- [ ] "Oda" ve "Mobilya" tablari arasinda gecis yapilabilir
- [ ] Her oge ikon + isim ile listelenir
- [ ] Hover'da gorsel geri bildirim (kayma animasyonu)
- [ ] Panel acilip kapatilabilir (toggle butonu)

## US-5.2: Sag Panel (Ozellikler)
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, secili nesnenin ozelliklerini gormek ve duzenlemek istiyorum.

**Kabul Kriterleri**:
- [ ] Secili oda icin: tip, en, boy, renk gosterilir
- [ ] Secili mobilya icin: tip, boyut parametreleri gosterilir
- [ ] Tum oda ve mobilya listesi goruntulenir
- [ ] Panel acilip kapatilabilir

## US-5.3: Alt Bar (Araclar)
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, sik kullandigim araclara (dondur, gorunum, kaydet, yukle) alt bardan hizlica erismek istiyorum.

**Kabul Kriterleri**:
- [ ] Dondur, Gorunum Degistir, Kaydet, Yukle butonlari gorunur
- [ ] Dondur butonu sadece nesne seciliyken vurgulu olur
- [ ] Butonlar hover'da gorsel geri bildirim verir
- [ ] Mobilde butonlar yeterli boyutta (minimum 44x44px touch target)

## US-5.4: Responsive Tasarim
**Persona**: Elif (Ev Sahibi)
**Hikaye**: Bir ev sahibi olarak, uygulamayi hem bilgisayarimda hem telefonumda rahatca kullanmak istiyorum.

**Kabul Kriterleri**:
- [ ] Masaustu (1280px+): sol + sag paneller yan yana goruntulenir
- [ ] Tablet (768px-1279px): paneller daraltilmis/overlay
- [ ] Mobil (375px-767px): paneller tam ekran overlay, alt bar sabit
- [ ] Touch gestleri: pinch-zoom, tek parmak surekleme
- [ ] Canvas tum ekran boyutlarinda dogru render edilir

---

# Persona-Hikaye Eslestirme

| Hikaye | Elif (Ev Sahibi) | Ahmet (Ic Mimar) | MobiDeko (Sirket) |
|--------|:-:|:-:|:-:|
| US-1.1 Oda Ekleme | Birincil | Birincil | - |
| US-1.2 Oda Boyutlandirma | Birincil | Birincil | - |
| US-1.3 Oda Konumlandirma | Birincil | Birincil | - |
| US-1.4 Oda Dondurme | Birincil | Birincil | - |
| US-1.5 Oda Silme | Birincil | Birincil | - |
| US-2.1 Mobilya Ekleme | Birincil | Birincil | Ikincil |
| US-2.2 Mobilya Surekleme | Birincil | Birincil | - |
| US-2.3 Mobilya Boyutlandirma | Birincil | Birincil | Ikincil |
| US-2.4 Mobilya Dondurme | Birincil | Birincil | - |
| US-2.5 Mobilya Silme | Birincil | Birincil | - |
| US-3.1 3D Gorunum | Birincil | Birincil | Ikincil |
| US-3.2 Ust Gorunum | Birincil | Birincil | - |
| US-3.3 Nesne Secimi | Birincil | Birincil | - |
| US-4.1 Otomatik Kayit | Birincil | Birincil | - |
| US-4.2 JSON Export | Ikincil | Birincil | - |
| US-4.3 JSON Import | Ikincil | Birincil | - |
| US-5.1 Sol Panel | Birincil | Birincil | - |
| US-5.2 Sag Panel | Birincil | Birincil | - |
| US-5.3 Alt Bar | Birincil | Ikincil | - |
| US-5.4 Responsive | Birincil | Ikincil | Ikincil |

---

# INVEST Dogrulama

| Kriter | Durum |
|--------|-------|
| **Independent** | Her hikaye bagimsiz gelistirilebilir (bagimliliklari belirtilmis) |
| **Negotiable** | Kabul kriterleri esnek, detaylar gorusmeye acik |
| **Valuable** | Her hikaye kullaniciya somut deger katiyor |
| **Estimable** | Orta buyukluk, tahmin edilebilir is yukleri |
| **Small** | Her hikaye 1-3 gunluk gelistirme eforu |
| **Testable** | Her hikaye 4-6 test edilebilir kabul kriteri iceriyor |
