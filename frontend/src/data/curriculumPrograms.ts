export type CurriculumSystem = "chinh-quy" | "tu-xa";

export type CurriculumProgram = {
  id: string;
  system: CurriculumSystem;
  cohort: string; // e.g. "2022"
  major: string; // e.g. "cntt"
  majorLabel: string; // e.g. "Cử nhân ngành Công nghệ Thông tin"
  title: string;
  html: string; // HTML (Quill output)
  updatedAt?: string;
};

export const defaultCurriculumPrograms: CurriculumProgram[] = [
  {
    id: "cq-2022-cntt",
    system: "chinh-quy",
    cohort: "2022",
    major: "cntt",
    majorLabel: "Cử nhân ngành Công nghệ Thông Tin",
    title: "A. NGÀNH CÔNG NGHỆ THÔNG TIN",
    html: `
<h1>A. NGÀNH CÔNG NGHỆ THÔNG TIN</h1>
<h2>1. Giới thiệu</h2>
<h3>1.1. Mục tiêu đào tạo</h3>
<p>
  Chương trình Cử nhân Công nghệ Thông tin đào tạo những cử nhân ngành Công nghệ thông tin có phẩm chất chính trị tốt,
  có đạo đức nghề nghiệp, có ý thức trách nhiệm tổ chức, xã hội; có sức khoẻ tốt; nắm vững các kiến thức cơ bản và chuyên
  môn sâu về công nghệ thông tin (CNTT), đáp ứng các yêu cầu về nghiên cứu phát triển và ứng dụng công nghệ thông tin của xã hội;
  có năng lực tham mưu, tư vấn và có khả năng tổ chức thực hiện nhiệm vụ với tư cách của một chuyên viên trong lĩnh vực CNTT.
</p>
<p>
  Bên cạnh đó, trên cơ sở các kiến thức được trang bị ở trình độ đại học, người học có đủ năng lực từng bước hoàn thiện khả năng độc lập nghiên cứu,
  tự bồi dưỡng và tiếp tục lên học các trình độ cao hơn.
</p>
<h3>1.2. Vị trí và khả năng làm việc sau tốt nghiệp</h3>
<p>
  Cử nhân Công nghệ Thông tin tốt nghiệp tại Trường Đại học Công nghệ Thông tin có khả năng đảm nhiệm các vị trí sau:
</p>
<ul>
  <li>Chuyên viên thiết kế, xây dựng và quản lý các dự án nghiên cứu và ứng dụng CNTT.</li>
  <li>Chuyên viên quản lý, giám sát, đầu tư các dự án công nghệ thông tin.</li>
  <li>Chuyên viên khai thác dữ liệu và thông tin ứng dụng cho các doanh nghiệp trong vấn đề phân tích định lượng.</li>
  <li>Chuyên viên có kĩ năng phát triển các ứng dụng truyền thông xã hội và công nghệ Web.</li>
  <li>Cán bộ giảng dạy, nghiên cứu khoa học và ứng dụng CNTT ở các trường đại học và cao đẳng trên cả nước.</li>
</ul>
<h3>1.3. Quan điểm xây dựng chương trình đào tạo</h3>
<p>
  Chương trình được thiết kế sao cho đảm bảo đủ độ phủ, độ sâu nhất định nhằm tạo điều kiện, cơ hội phát triển cho sinh viên làm việc,
  và có thể tiếp tục nghiên cứu chuyên sâu về các chuyên ngành CNTT, trong đó độ phủ được đặt trọng tâm.
</p>
`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tx-2022-cntt",
    system: "tu-xa",
    cohort: "2022",
    major: "cntt",
    majorLabel: "Cử nhân ngành Công nghệ Thông Tin (Từ xa)",
    title: "A. NGÀNH CÔNG NGHỆ THÔNG TIN (TỪ XA)",
    html: `<h1>A. NGÀNH CÔNG NGHỆ THÔNG TIN (TỪ XA)</h1><p>Nội dung đang được PĐT cập nhật.</p>`,
  },
];


