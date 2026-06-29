# Expense Tracker App — Open Questions

## 1. Product Scope

**What categories of retailers are you comparing?**
*(Groceries only? All retail: restaurants, fuel, pharmacies? Or everything?)*

> Answer: I want to start with Groceries. Once first phase is matured extend it to other retail categories. I see there is not retail price comparison in Singapore expecially Indian retail shops as they do not advertise MRP on their merchandise.

---

**Is comparison at item-level (specific product) or basket/total level?**

> Answer: I am thinking of comparing at item level, for example I buy 10 items from a shop, show this would have been cheaper if bought in another shop, likewise show for all items. what do you think ?

---

**How will you handle product name variations across retailers?**
*(e.g. "GREAT VALUE 2% MILK 1GL" vs "MILK 2PCT GALLON GV")*

> Answer: do a fuzzy comparision for similarity. if not match put them as different items

---

## 2. Cold Start Problem

**How do you make the app valuable to day-one users before crowdsourced comparison data exists?**

> Answer: maybe share with some friends for testing and feeding data. Any other better suggestion ?

---

**What is the MVP feature set before retailer comparison is live?**

> Answer: OCR recording, manual recording, expense bucketing, analysis reports in graph format, grocery retailer comparison.

---

## 3. Geography & Market

**Which market(s) are you targeting first?**
*(UK, US, India, Australia, other?)*

> Answer: Singapore

---

**Are comparisons local (city/region), national, or global?**

> Answer: Local (Singapore only)

---

## 4. Privacy & Consent

**What exactly counts as "masked PII" in your model?**
*(Receipts contain: name, partial card number, store address, items, date/time)*

> Answer: WE DO NOT collect any payment information like card details or bank details. I intend to capture users email, password, mobile number, retailer address. I am thinking of anonymizing bills in cloud to compare retailers. bills should not be tied to any user while posting to cloud. what are your thoughts 

---

**Is the retailer comparison a user benefit or a monetisation strategy — or both?**
*(This shapes how you frame consent)*

> Answer: MVP - user benefit. Once we garner decent data, we can plan on monetizing. But I thin retailer comparision is a monetizing feature, if we give it for free at the start, how can we monetize it later ? converting a free feature to paid will have -ve consenquence is what I think. what is your opinion on this?

---

**How will you handle GDPR / CCPA for targeted advertising based on purchase behaviour?**

> Answer: Since we will be operating only in Singoare, does it apply for us? Are we really doing targeted advertising in suggesting which shop/retailer is cheaper? 

---

**Will users explicitly opt in to data sharing for retailer benchmarking and offers?**

> Answer: I think users should not have control over this. we should just tell what we collect, like image for extracting data, but image will be deleted post extraction and confirmation by user. save store bills by exclusing user/employee names and so on. 

---

## 5. Retailer Relationship

**Do retailers know they are being benchmarked?**

> Answer: No, not in MVP. Will this have any legal implications?

---

**Will you pursue retailer partnerships (like Ibotta/Fetch Rewards) or operate passively?**

> Answer: MVP - operate passively. Later maybe partnership.

---

**If a retailer objects to being benchmarked as "expensive", how do you handle that?**

> Answer: we do not put label as expenive, we only show that this item can be bought for lesser price at another retailer (retailer name). NOT TO BE offensive to any retailer but be informative to user. Same message but different communication. 

---

## 6. OCR Accuracy

**Is Tesseract OCR sufficient, or will you invest in fine-tuning / a paid OCR service?**

> Answer: Lets go with opensource decent model, since we also want user to confirm before accepting the result. 

---

**What is your acceptable OCR error rate for the retailer comparison to remain trustworthy?**

> Answer: 20% error rate

---

**How will you handle faded/poor quality receipt scans?**

> Answer: if errro rate is > 20%, we prompt user that image is not clear, retry or enter manually

---

## 7. Technical — Mobile

**React Native with Expo, or bare React Native?**

> Answer: bare native. 

---

**How will you handle camera permission and image quality differences across iOS and Android?**

> Answer: Lets first work on Dev version of android and then can think of permissions. Is there somehting we need to clarifiy first ?

---

## 8. Technical — Backend

**How will you handle OCR image preprocessing on the .NET backend?**
*(deskewing, contrast enhancement, noise reduction)*

> Answer: May be we will have a Python service/code that can be invoked by .net BE

---

**Where will receipt images be stored, and for how long?**

> Answer: image should be stored in users phone. for processing we upload the image to temp location. if user accepts the output of OCR, we clean the image immediately, if crashed in between we keep for 2 hours and then clear off.

---

## 9. Business Model

**What is the primary revenue model at launch?**
*(Freemium, subscription, retailer advertising, B2B data licensing)*

> Answer: At lauch is Freemium. 

---

**At what user scale does the advertising model become viable?**

> Answer: No decision at the moment

---

## 10. Regulatory

**Have you reviewed the specific data/financial regulations for your target market?**

> Answer: None, do it for me. Singapore location

---

**Are you aware of any active regulatory scrutiny on grocery pricing in your target market?**
*(e.g. UK CMA supermarket pricing investigations)*

> Answer: I am not aware. DO research for me.

---
