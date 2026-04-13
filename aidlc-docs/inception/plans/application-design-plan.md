# Application Design Plan - EviniYerlestir

## Plan Adimlari

- [x] Step 1: Component tanimlarini olustur (components.md)
- [x] Step 2: Component method'larini tanimla (component-methods.md)
- [x] Step 3: Service katmanini tasarla (services.md)
- [x] Step 4: Component bagimlilik haritasini olustur (component-dependency.md)
- [x] Step 5: Konsolide tasarim dokumani (application-design.md)

---

## Tasarim Sorulari

## Question 1
Mobilya handle-based resize ve surekleme icin 3D etkilesim yaklasimi ne olmali?

A) Gizmo sistemi (Three.js TransformControls benzeri) - 3 eksenli ok/halka gostergeleri ile tasi/dondur/boyutlandir
B) Ozel handle'lar - mobilyanin kose/kenarlarinda kucuk kutular, surukleyince boyut degisir; govdeye tikla-surukle ile tasi
C) Mod tabanli - alt bardan "Tasi/Dondur/Boyutlandir" modu sec, tiklama o islemi yapar
X) Other (please describe after [Answer]: tag below)

[Answer]: Bu tarz ürünlerde en çok kullanılan hangisiyse o

---

## Question 2
State yonetiminde mobilya-oda iliskisi nasil modellenmeli?

A) Bagimsiz - odalar ve mobilyalar ayri koleksiyonlarda, fiziksel konum ile iliskilendirilir (odanin icinde mi diye kontrol)
B) Hiyerarsik - her mobilya bir oda'ya ait (parentId), oda tasindiginda mobilyalari da tasir
C) Hibrit - varsayilan bagimsiz, kullanici "odaya sabitle" secenegi ile baglar
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---
