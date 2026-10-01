package io.github.EEES0.docxeditor.service;

import io.github.EEES0.docxeditor.dto.ContentNode;
import io.github.EEES0.docxeditor.dto.CreateFileRequest;
import io.github.EEES0.docxeditor.dto.TextNode;
import kr.dogfoot.hwplib.object.HWPFile;
import kr.dogfoot.hwplib.object.bodytext.Section;
import kr.dogfoot.hwplib.object.bodytext.paragraph.Paragraph;
import kr.dogfoot.hwplib.tool.blankfilemaker.BlankFileMaker;
import org.springframework.stereotype.Service;
import kr.dogfoot.hwplib.writer.HWPWriter;
import java.io.ByteArrayOutputStream;


@Service
public class CreateHwp {

    public byte[] createHwpByte(CreateFileRequest request) throws Exception {
        HWPFile hwpFile = BlankFileMaker.make();
        Section section = hwpFile.getBodyText()
                .getSectionList().getFirst();
        int index = 0;

        for (ContentNode content : request.content()) {
            Paragraph paragraph;

            if (index == 0) {
                paragraph = section.getParagraph(0);
            } else {
                paragraph = section.addNewParagraph();

// 첫 문단의 기본 설정 복사
                paragraph.getHeader().copy(
                        section.getParagraph(0).getHeader()
                );

// 구역·단 설정은 첫 문단에만 유지
                paragraph.getHeader().getControlMask().setValue(0);
                paragraph.getHeader().getDivideSort().setValue((short) 0);

// 텍스트 생성: 빈 문단도 문단 끝 문자를 갖도록 처리
                paragraph.createText();
                paragraph.getText().addString("");

// 기본 글자 모양: 위치 0부터 글자 모양 ID 0 적용
                paragraph.createCharShape();
                paragraph.getCharShape().addParaCharShape(0, 0);

                paragraph.getHeader().setCharShapeCount(1);

// 복사한 헤더의 줄 배치·범위 태그 정보 초기화
                paragraph.getHeader().setLineAlignCount(0);
                paragraph.getHeader().setRangeTagCount(0);
            }

            if (content.content() != null) {
                for (TextNode node : content.content()) {
                    paragraph.getText().addString(node.text());
                }
            }

            index++;
        }

        try (ByteArrayOutputStream output =
                     new ByteArrayOutputStream()) {
            HWPWriter.toStream(hwpFile, output);
            return output.toByteArray();

        }

    }
}
