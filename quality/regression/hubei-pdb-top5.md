# Hubei Policy Database Top 5 Regression

## Case
- Name: Hubei policy database default search top five
- Date: 2026-04-24
- URL: `https://www.hubei.gov.cn/pdb/search.shtml?fileType=all&keyword=&postNumber=`
- Requires login: no
- Target result: extract first five policies, detail metadata, document carrier, and summary-ready text where available.

## Observed Top Five

1. 点军区人民政府办公室关于印发《点军区农村客运补贴资金管理办法》的通知
   - 文号：点政办发〔2026〕3号
   - 发布机构：点军区人民政府办公室
   - 发布日期：2026年04月24日
   - PDF: `https://img.xxgk.yichang.gov.cn/uploads/image/20260424/a3fdee0a7b7a81f4f1fb0d88dcbe6624.pdf`
   - Full text extraction: passed

2. 关于加强市政给排水管道工程质量安全管理的通知
   - 文号：宜住发〔2026〕5号
   - 发布机构：宜昌市住房和城市更新局
   - 发布日期：2026年04月21日
   - PDF: `https://img.xxgk.yichang.gov.cn/uploads/image/20260421/c951d38617ea4442d88060abcecdc253.pdf`
   - Full text extraction: passed

3. 江陵县人民政府办公室关于印发《江陵县政府投资项目财政评审办法》的通知
   - 文号：江政办发〔2026〕6号
   - 发布机构：江政办发
   - 发布日期：2026年04月21日
   - PDF emitted by page: `//www.hubei.gov.cn/pdbstaticsnull`
   - Full text extraction: failed due to malformed resource
   - Correct behavior: report metadata and resource failure; do not infer unread body as extracted content.

4. 省科技厅关于印发《关于加强湖北省科技计划项目科技伦理监管的实施方案》的通知
   - 文号：鄂科技发监〔2026〕3号
   - 发布机构：湖北省科学技术厅
   - 发布日期：2026年04月20日
   - PDF: `https://kjt.hubei.gov.cn/norms/202604/W020260421404348109374.pdf`
   - Full text extraction: passed

5. 枝江市人民政府关于划定枝江市金润源绿色产业投资有限公司专用铁路线路安全保护区的通告
   - 文号：枝府发〔2026〕2号
   - 发布机构：枝江市人民政府
   - 发布日期：2026年04月17日
   - PDF: `https://img.xxgk.yichang.gov.cn/uploads/image/20260417/a18b61f43c0079cbdb4e3a3754017e02.pdf`
   - Full text extraction: passed

## Runtime Path
- Run Runtime Doctor.
- Open search page with original URL and empty parameters preserved.
- Extract list text and anchors.
- Open each detail page.
- Read DOM metadata.
- Intercept `window.open`.
- Click `#pdf-print`.
- Capture PDF URL or malformed resource.
- Download/extract PDF text when valid.

## Key Assertions
- Search URL keeps `keyword=` and `postNumber=`.
- Detail URLs keep `articleid` and `sign`.
- DOM metadata is extracted even when full text is in PDF.
- Button-triggered PDF resources are captured.
- Malformed `pdbstaticsnull` is reported as resource failure.

## Result
- Passed with partial-resource failure correctly classified.
- 4/5 PDF bodies extracted.
- 5/5 metadata records extracted.

## Follow-up
- Add automated runtime regression for button-triggered document resource capture.
- Add fallback lookup via source-site and interpretation links for malformed resource cases.
