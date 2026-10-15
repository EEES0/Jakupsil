# 작업실

> 다양한 문서 작업을 처리하는 도구 모음

## 서비스 주소

- 배포 주소: https://jakupsil.onrender.com
- GitHub: https://github.com/EEES0/Jakupsil
- Notion: https://app.notion.com/p/3ce5c71ebece809cadefe10042e0ec25?source=copy_link

## 개발 목적

문서 몇 개 작업하려고 구독할 돈도 아깝고,
이참에 스프링 프로젝트도 할 겸 만들었습니다.

## 주요 기능

### 구현 완료

- [x] 웹 DOCX 문서 편집기
- [x] DOCX 문서를 PDF로 변환
- [x] 이미지를 PDF로 변환
- [x] 이미지 대비 강조 도구
- [x] PDF 병합
- [x] 이미지에서 텍스트 추출(베타)

### 개발 예정

- [ ] 폰트 변경 기능
- [ ] 서버에 문서 저장
- [ ] 회원가입, 로그인
- [ ] 도구 추가 예정

## 기술 스택

| 구분 | 기술 |
|---|---|
| Backend | Java 21, Spring Boot 4.1.1, Spring Web MVC |
| Frontend | HTML, CSS, JavaScript, Canvas API |
| Editor | Tiptap 3.31.3 |
| DOCX 생성 | Apache POI 5.5.1 |
| DOCX → PDF 변환 | Python, word2pdf 0.1.0 |
| PDF 생성·병합 | Apache PDFBox 3.0.6 |
| 이미지 보정 | OpenCV 4.9.0-0 |
| 이미지 메타데이터 | metadata-extractor 2.21.0 |
| OCR | Tess4J 5.11.0, Tesseract OCR |
| Test | JUnit 5, Mockito, Spring Test |
| Build | Gradle |
| CI | GitHub Actions |
| 배포 | Docker, Eclipse Temurin 21, Render |