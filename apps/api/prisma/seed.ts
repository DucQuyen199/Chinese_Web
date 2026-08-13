import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chineseExpansionRows } from './chinese-vocabulary.js';
import { chineseHskAdvancedRows } from './chinese-hsk-advanced.js';

const prisma = new PrismaClient();

const vocabularyRows = [
  ['你好', 'nǐ hǎo', 'Xin chào', 'Cụm từ'], ['谢谢', 'xièxie', 'Cảm ơn', 'Động từ'], ['再见', 'zàijiàn', 'Tạm biệt', 'Động từ'], ['请', 'qǐng', 'Mời; vui lòng', 'Động từ'], ['对不起', 'duìbuqǐ', 'Xin lỗi', 'Cụm từ'], ['没关系', 'méi guānxi', 'Không sao', 'Cụm từ'], ['是', 'shì', 'Là; đúng', 'Động từ'], ['不', 'bù', 'Không', 'Phó từ'], ['也', 'yě', 'Cũng', 'Phó từ'], ['很', 'hěn', 'Rất', 'Phó từ'],
  ['我', 'wǒ', 'Tôi; mình', 'Đại từ'], ['你', 'nǐ', 'Bạn', 'Đại từ'], ['他', 'tā', 'Anh ấy', 'Đại từ'], ['她', 'tā', 'Cô ấy', 'Đại từ'], ['我们', 'wǒmen', 'Chúng tôi; chúng ta', 'Đại từ'], ['什么', 'shénme', 'Cái gì', 'Đại từ'], ['谁', 'shéi', 'Ai', 'Đại từ'], ['哪儿', 'nǎr', 'Ở đâu', 'Đại từ'], ['名字', 'míngzi', 'Tên', 'Danh từ'], ['叫', 'jiào', 'Tên là; gọi', 'Động từ'],
  ['学生', 'xuésheng', 'Học sinh; sinh viên', 'Danh từ'], ['老师', 'lǎoshī', 'Giáo viên', 'Danh từ'], ['朋友', 'péngyou', 'Bạn bè', 'Danh từ'], ['家', 'jiā', 'Nhà; gia đình', 'Danh từ'], ['学校', 'xuéxiào', 'Trường học', 'Danh từ'], ['中国', 'Zhōngguó', 'Trung Quốc', 'Danh từ riêng'], ['中文', 'Zhōngwén', 'Tiếng Trung', 'Danh từ'], ['学习', 'xuéxí', 'Học tập', 'Động từ'], ['喜欢', 'xǐhuan', 'Thích', 'Động từ'], ['吃', 'chī', 'Ăn', 'Động từ'],
  ['喝', 'hē', 'Uống', 'Động từ'], ['看', 'kàn', 'Xem; đọc', 'Động từ'], ['听', 'tīng', 'Nghe', 'Động từ'], ['说', 'shuō', 'Nói', 'Động từ'], ['读', 'dú', 'Đọc', 'Động từ'], ['写', 'xiě', 'Viết', 'Động từ'], ['买', 'mǎi', 'Mua', 'Động từ'], ['去', 'qù', 'Đi', 'Động từ'], ['来', 'lái', 'Đến', 'Động từ'], ['想', 'xiǎng', 'Muốn; nghĩ', 'Động từ'],
  ['今天', 'jīntiān', 'Hôm nay', 'Danh từ'], ['明天', 'míngtiān', 'Ngày mai', 'Danh từ'], ['昨天', 'zuótiān', 'Hôm qua', 'Danh từ'], ['现在', 'xiànzài', 'Bây giờ', 'Danh từ'], ['早上', 'zǎoshang', 'Buổi sáng', 'Danh từ'], ['晚上', 'wǎnshang', 'Buổi tối', 'Danh từ'], ['时间', 'shíjiān', 'Thời gian', 'Danh từ'], ['多少', 'duōshao', 'Bao nhiêu', 'Đại từ'], ['一点儿', 'yìdiǎnr', 'Một chút', 'Số lượng từ'], ['喜欢', 'xǐhuan', 'Thích', 'Động từ'],
  ['工作', 'gōngzuò', 'Công việc; làm việc', 'Động từ'], ['公司', 'gōngsī', 'Công ty', 'Danh từ'], ['北京', 'Běijīng', 'Bắc Kinh', 'Danh từ riêng'], ['天气', 'tiānqì', 'Thời tiết', 'Danh từ'], ['下雨', 'xiàyǔ', 'Mưa', 'Động từ'], ['因为', 'yīnwèi', 'Bởi vì', 'Liên từ'], ['所以', 'suǒyǐ', 'Cho nên', 'Liên từ'], ['但是', 'dànshì', 'Nhưng', 'Liên từ'], ['已经', 'yǐjīng', 'Đã', 'Phó từ'], ['一起', 'yìqǐ', 'Cùng nhau', 'Phó từ'],
] as const;

const sentenceFor = (word: string) => word === '你好' ? '你好，我叫小明。' : `我学习${word}。`;
const pinyinFor = (word: string, pinyin: string) => word === '你好' ? 'Nǐ hǎo, wǒ jiào Xiǎomíng.' : `Wǒ xuéxí ${pinyin}.`;

function expansionExample(simplified: string, pinyin: string, partOfSpeech: string, meaningVi: string) {
  if (partOfSpeech === 'Động từ') return { exampleCn: `我会${simplified}。`, examplePy: `Wǒ huì ${pinyin}.`, exampleVi: `Tôi đang học cách dùng “${simplified}” (${meaningVi}).` };
  if (partOfSpeech === 'Tính từ') return { exampleCn: `这个很${simplified}。`, examplePy: `Zhège hěn ${pinyin}.`, exampleVi: `Từ “${simplified}” diễn tả ${meaningVi.toLowerCase()}.` };
  if (partOfSpeech === 'Số từ') return { exampleCn: `这是第${simplified}个。`, examplePy: `Zhè shì dì ${pinyin} gè.`, exampleVi: `Đây là số thứ ${meaningVi.toLowerCase()}.` };
  if (partOfSpeech === 'Liên từ') return { exampleCn: `我学习${simplified}，也练习听力。`, examplePy: `Wǒ xuéxí ${pinyin}, yě liànxí tīnglì.`, exampleVi: `Luyện cách dùng “${simplified}” trong câu liên kết.` };
  if (partOfSpeech === 'Giới từ') return { exampleCn: `我从这里开始学习。`, examplePy: `Wǒ cóng zhèlǐ kāishǐ xuéxí.`, exampleVi: `Ví dụ ngữ cảnh cho từ “${simplified}” (${meaningVi}).` };
  return { exampleCn: `这是${simplified}。`, examplePy: `Zhè shì ${pinyin}.`, exampleVi: `Ví dụ sử dụng “${simplified}” (${meaningVi}).` };
}

async function main() {
  const [studentRole, teacherRole, adminRole] = await Promise.all([
    prisma.role.upsert({ where: { code: 'student' }, update: { name: 'Học viên' }, create: { code: 'student', name: 'Học viên' } }),
    prisma.role.upsert({ where: { code: 'teacher' }, update: { name: 'Giáo viên' }, create: { code: 'teacher', name: 'Giáo viên' } }),
    prisma.role.upsert({ where: { code: 'admin' }, update: { name: 'Quản trị viên' }, create: { code: 'admin', name: 'Quản trị viên' } }),
  ]);
  const permissions = ['course.read', 'course.manage', 'user.manage', 'content.manage', 'analytics.read'].map((code) => ({ code, name: code }));
  for (const permission of permissions) await prisma.permission.upsert({ where: { code: permission.code }, update: {}, create: permission });
  for (const role of [teacherRole, adminRole]) {
    for (const permission of permissions) {
      const storedPermission = await prisma.permission.findUniqueOrThrow({ where: { code: permission.code } });
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: storedPermission.id } }, update: {}, create: { roleId: role.id, permissionId: storedPermission.id } });
    }
  }

  const levels = await Promise.all(['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'].map((name, index) => prisma.courseLevel.upsert({ where: { code: `HSK${index + 1}` }, update: { name }, create: { code: `HSK${index + 1}`, name, order: index + 1 } })));
  const categories = await Promise.all([
    prisma.courseCategory.upsert({ where: { slug: 'foundation' }, update: {}, create: { slug: 'foundation', name: 'Nền tảng' } }),
    prisma.courseCategory.upsert({ where: { slug: 'exam-prep' }, update: {}, create: { slug: 'exam-prep', name: 'Luyện thi HSK' } }),
  ]);
  const hskLevels = await Promise.all(levels.map((level, index) => prisma.hskLevel.upsert({ where: { code: level.code }, update: {}, create: { code: level.code, name: level.name, order: index + 1, description: `Lộ trình từ vựng và kỹ năng ${level.name}.` } })));

  const removedNonChinese = await prisma.vocabulary.deleteMany({ where: { language: { not: 'zh-CN' } } });
  if (removedNonChinese.count > 0) console.log(`Removed ${removedNonChinese.count} non-Chinese vocabulary records.`);

  const vocabulary = [];
  for (const [index, row] of vocabularyRows.entries()) {
    const [simplified, pinyin, meaningVi, partOfSpeech] = row;
    const hskLevel = index < 40 ? 'HSK 1' : 'HSK 2';
    const item = await prisma.vocabulary.upsert({ where: { simplified }, update: { language: 'zh-CN', pinyin, meaningVi, partOfSpeech, hskLevel, exampleCn: sentenceFor(simplified), examplePy: pinyinFor(simplified, pinyin), exampleVi: `${meaningVi} trong một câu ví dụ.` }, create: { simplified, language: 'zh-CN', pinyin, meaningVi, partOfSpeech, hskLevel, exampleCn: sentenceFor(simplified), examplePy: pinyinFor(simplified, pinyin), exampleVi: `${meaningVi} trong một câu ví dụ.` } });
    vocabulary.push(item);
  }
  const existingVocabularyKeys = new Set((await prisma.vocabulary.findMany({ select: { simplified: true } })).map(({ simplified }) => simplified));
  for (const [simplified, rawPinyin, meaningVi, partOfSpeech, hskLevel] of chineseExpansionRows) {
    if (existingVocabularyKeys.has(simplified)) continue;
    const pinyin = simplified === '拒绝' ? 'jùjué' : rawPinyin;
    const example = expansionExample(simplified, pinyin, partOfSpeech, meaningVi);
    await prisma.vocabulary.create({ data: { simplified, language: 'zh-CN', pinyin, meaningVi, partOfSpeech, hskLevel, ...example } });
    existingVocabularyKeys.add(simplified);
  }
  for (const [simplified, pinyin, meaningVi, partOfSpeech, hskLevel] of chineseHskAdvancedRows) {
    if (existingVocabularyKeys.has(simplified)) continue;
    const example = expansionExample(simplified, pinyin, partOfSpeech, meaningVi);
    await prisma.vocabulary.create({ data: { simplified, language: 'zh-CN', pinyin, meaningVi, partOfSpeech, hskLevel, ...example } });
    existingVocabularyKeys.add(simplified);
  }
  // Rebuild HSK links from the current Chinese level assignments so stale links
  // cannot inflate a level's count after vocabulary is reclassified.
  await prisma.hskVocabulary.deleteMany({ where: { vocabulary: { language: 'zh-CN' } } });
  // Build all course decks from the Chinese vocabulary only.
  const uniqueVocabulary = await prisma.vocabulary.findMany({ where: { language: 'zh-CN' }, orderBy: { createdAt: 'asc' }, take: 1000 });
  for (const [index, item] of uniqueVocabulary.entries()) {
    const level = hskLevels.find(({ name }) => name === item.hskLevel) ?? hskLevels[index < 40 ? 0 : 1];
    await prisma.hskVocabulary.create({ data: { hskLevelId: level.id, vocabularyId: item.id } });
  }

  const radicals = await Promise.all([
    ['亻', 'Nhân đứng', 'Người', 2, 90], ['氵', 'Tam điểm thủy', 'Nước', 3, 85], ['口', 'Khẩu', 'Miệng', 3, 80], ['女', 'Nữ', 'Phụ nữ', 3, 68], ['木', 'Mộc', 'Cây', 4, 65], ['日', 'Nhật', 'Mặt trời', 4, 62], ['心', 'Tâm', 'Tim; tâm trí', 4, 58], ['讠', 'Ngôn', 'Lời nói', 2, 55], ['宀', 'Miên', 'Mái nhà', 3, 52], ['手', 'Thủ', 'Tay', 4, 50],
  ].map(([glyph, nameVi, meaningVi, strokeCount, frequency]) => prisma.radical.upsert({ where: { glyph: glyph as string }, update: {}, create: { glyph: glyph as string, nameVi: nameVi as string, meaningVi: meaningVi as string, strokeCount: strokeCount as number, frequency: frequency as number } })));
  const characterRows = [['你', 'nǐ', 'Bạn', 7, 'HSK 1', 0], ['好', 'hǎo', 'Tốt', 6, 'HSK 1', 3], ['学', 'xué', 'Học', 8, 'HSK 1', 8], ['校', 'xiào', 'Trường', 10, 'HSK 1', 4], ['中', 'zhōng', 'Giữa; Trung', 4, 'HSK 1', 2], ['国', 'guó', 'Nước; quốc gia', 8, 'HSK 1', 8], ['我', 'wǒ', 'Tôi', 7, 'HSK 1', 9], ['吃', 'chī', 'Ăn', 6, 'HSK 1', 2], ['喝', 'hē', 'Uống', 12, 'HSK 1', 1], ['水', 'shuǐ', 'Nước', 4, 'HSK 1', 1], ['家', 'jiā', 'Nhà', 10, 'HSK 1', 8], ['天', 'tiān', 'Trời; ngày', 4, 'HSK 1', 5], ['气', 'qì', 'Khí; không khí', 4, 'HSK 1', 5], ['雨', 'yǔ', 'Mưa', 8, 'HSK 2', 1], ['工', 'gōng', 'Công việc', 3, 'HSK 2', 4], ['作', 'zuò', 'Làm', 7, 'HSK 2', 4], ['朋', 'péng', 'Bạn', 8, 'HSK 1', 2], ['友', 'yǒu', 'Bạn', 4, 'HSK 1', 0], ['早', 'zǎo', 'Sớm', 6, 'HSK 1', 5], ['晚', 'wǎn', 'Tối; muộn', 11, 'HSK 1', 5]] as const;
  for (const [glyph, pinyin, meaningVi, strokeCount, hskLevel, radicalIndex] of characterRows) await prisma.character.upsert({ where: { glyph }, update: { pinyin, meaningVi }, create: { glyph, pinyin, meaningVi, strokeCount, hskLevel, radicalId: radicals[radicalIndex]?.id, examples: [`${glyph}好`] } });

  const grammarRows = [
    ['是...的', 'Nhấn mạnh thông tin đã xảy ra', 'Dùng 是...的 để nhấn mạnh thời gian, địa điểm hoặc cách thức.', '我是坐飞机来的。', 'Wǒ shì zuò fēijī lái de.', 'Tôi đến bằng máy bay.', 'Bỏ 的 khi muốn nói sự việc đang diễn ra.', 'HSK 2'],
    ['因为...所以...', 'Bởi vì... nên...', 'Liên kết nguyên nhân và kết quả trong một câu.', '因为今天下雨，所以我不去学校。', 'Yīnwèi jīntiān xiàyǔ, suǒyǐ wǒ bù qù xuéxiào.', 'Bởi vì hôm nay trời mưa nên tôi không đi học.', 'Không đảo vị trí hai vế.', 'HSK 2'],
    ['一边...一边...', 'Vừa... vừa...', 'Diễn tả hai hành động cùng diễn ra.', '我一边听音乐，一边学习。', 'Wǒ yìbiān tīng yīnyuè, yìbiān xuéxí.', 'Tôi vừa nghe nhạc vừa học.', null, 'HSK 2'],
    ['把 + O + V', 'Đưa tân ngữ lên trước', 'Nhấn mạnh cách xử lý một đối tượng.', '请把书放在桌子上。', 'Qǐng bǎ shū fàng zài zhuōzi shàng.', 'Hãy đặt sách lên bàn.', 'Sau động từ thường cần bổ ngữ.', 'HSK 3'],
    ['越来越...', 'Càng ngày càng...', 'Diễn tả mức độ thay đổi theo thời gian.', '天气越来越冷了。', 'Tiānqì yuèláiyuè lěng le.', 'Thời tiết càng ngày càng lạnh.', null, 'HSK 3'],
    ['除了...以外...', 'Ngoài... ra...', 'Bổ sung một đối tượng hoặc phạm vi.', '除了中文以外，我还学习英语。', 'Chúle Zhōngwén yǐwài, wǒ hái xuéxí Yīngyǔ.', 'Ngoài tiếng Trung, tôi còn học tiếng Anh.', null, 'HSK 3'],
    ['如果...就...', 'Nếu... thì...', 'Diễn tả điều kiện và kết quả.', '如果你有时间，就来我家吧。', 'Rúguǒ nǐ yǒu shíjiān, jiù lái wǒ jiā ba.', 'Nếu bạn có thời gian thì đến nhà tôi nhé.', null, 'HSK 2'],
    ['虽然...但是...', 'Mặc dù... nhưng...', 'Diễn tả quan hệ nhượng bộ.', '虽然很累，但是我还要学习。', 'Suīrán hěn lèi, dànshì wǒ hái yào xuéxí.', 'Mặc dù rất mệt nhưng tôi vẫn phải học.', null, 'HSK 3'],
    ['除了...还...', 'Ngoài... còn...', 'Bổ sung thông tin ngang hàng.', '他除了会说中文，还会说英文。', 'Tā chúle huì shuō Zhōngwén, hái huì shuō Yīngwén.', 'Ngoài nói tiếng Trung, anh ấy còn nói tiếng Anh.', null, 'HSK 3'],
    ['V + 过', 'Đã từng', 'Diễn tả trải nghiệm trong quá khứ.', '我去过北京。', 'Wǒ qùguo Běijīng.', 'Tôi đã từng đi Bắc Kinh.', 'Không dùng cùng 了 cho cùng một động từ.', 'HSK 2'],
  ] as const;
  for (const [pattern, meaningVi, explanation, exampleCn, examplePy, exampleVi, commonMistake, hskLevel] of grammarRows) await prisma.grammarPoint.upsert({ where: { pattern }, update: { meaningVi, explanation }, create: { pattern, meaningVi, explanation, exampleCn, examplePy, exampleVi, commonMistake, hskLevel } });

  const courseSpecs = [
    { slug: 'chinese-foundation', title: 'Nền tảng tiếng Trung', subtitle: 'Nền tảng giao tiếp cho người mới bắt đầu', description: 'Xây dựng nền móng phát âm, pinyin và những mẫu câu đầu tiên để bạn tự tin bắt đầu hành trình tiếng Trung.', level: levels[0], category: categories[0], color: '#E53935', duration: 18, lessons: [['01', 'Làm quen với tiếng Trung', 'Pinyin, thanh điệu và cách chào hỏi'], ['02', 'Giới thiệu bản thân', 'Tên, quốc tịch và nghề nghiệp'], ['03', 'Gia đình và bạn bè', 'Mô tả những người thân yêu']] },
    { slug: 'hsk-1-core', title: 'HSK 1 · Nền tảng', subtitle: '150 từ vựng và cấu trúc thiết yếu', description: 'Lộ trình HSK 1 có hướng dẫn, luyện tập theo bốn kỹ năng và ôn tập SRS mỗi ngày.', level: levels[0], category: categories[1], color: '#F97316', duration: 24, lessons: [['01', 'Chào hỏi mỗi ngày', 'Hội thoại cơ bản trong đời sống'], ['02', 'Thời gian và lịch trình', 'Nói về ngày, giờ và hoạt động'], ['03', 'Mua sắm đơn giản', 'Hỏi giá và lựa chọn sản phẩm']] },
    { slug: 'hsk-2-conversation', title: 'HSK 2 · Giao tiếp', subtitle: 'Nói tự nhiên trong 12 tình huống', description: 'Mở rộng vốn từ và phản xạ giao tiếp với các đoạn hội thoại thực tế, tốc độ vừa phải.', level: levels[1], category: categories[1], color: '#8B5CF6', duration: 30, lessons: [['01', 'Một ngày của tôi', 'Kể về thói quen và lịch trình'], ['02', 'Thời tiết hôm nay', 'Mô tả thời tiết và kế hoạch'], ['03', 'Cuối tuần cùng bạn bè', 'Đề xuất và phản hồi lời mời']] },
    { slug: 'hsk-3-real-life', title: 'HSK 3 · Đời sống thực tế', subtitle: 'Mở rộng phản xạ trong các tình huống thường ngày', description: 'Luyện từ vựng HSK 3 qua công việc, sức khỏe, du lịch và các cuộc trò chuyện tự nhiên.', level: levels[2], category: categories[1], color: '#2F9E73', duration: 36, lessons: [['01', 'Công việc và kế hoạch', 'Nói về nhiệm vụ, mục tiêu và thói quen'], ['02', 'Sức khỏe và dịch vụ', 'Mô tả triệu chứng và nhờ giúp đỡ'], ['03', 'Du lịch và trải nghiệm', 'Kể lại chuyến đi và điều đã học']] },
    { slug: 'hsk-4-reading', title: 'HSK 4 · Đọc hiểu', subtitle: 'Đọc văn bản dài hơn và diễn đạt chính xác', description: 'Củng cố vốn từ HSK 4, luyện liên kết ý và phản hồi trong các chủ đề học tập, xã hội.', level: levels[3], category: categories[1], color: '#D97706', duration: 42, lessons: [['01', 'Ý kiến và lập luận', 'Trình bày quan điểm có lý do'], ['02', 'Môi trường và xã hội', 'Đọc thông tin và tìm ý chính'], ['03', 'Học tập và áp lực', 'Trao đổi giải pháp và kinh nghiệm']] },
    { slug: 'hsk-5-academic', title: 'HSK 5 · Học thuật ứng dụng', subtitle: 'Từ vựng học thuật trong bối cảnh thực tế', description: 'Luyện đọc, nghe và viết với các chủ đề văn hóa, công việc, nghiên cứu và phát triển cá nhân.', level: levels[4], category: categories[1], color: '#4F46E5', duration: 48, lessons: [['01', 'Văn hóa và truyền thống', 'Phân tích thông tin và ví dụ'], ['02', 'Công việc và hiệu quả', 'Mô tả quy trình và đánh giá'], ['03', 'Nghiên cứu và giải pháp', 'Tổng hợp ý tưởng và kết luận']] },
    { slug: 'hsk-6-advanced', title: 'HSK 6 · Chuyên sâu', subtitle: 'Diễn đạt linh hoạt ở trình độ cao', description: 'Thử thách với từ vựng HSK 6, văn phong trang trọng và các bài luyện tổng hợp bốn kỹ năng.', level: levels[5], category: categories[1], color: '#7C3AED', duration: 60, lessons: [['01', 'Xung đột và thương lượng', 'Luyện lập luận, phản biện và thỏa thuận'], ['02', 'Chiến lược và xã hội', 'Đọc phân tích và nêu hệ quả'], ['03', 'Tư duy độc lập', 'Viết quan điểm có dẫn chứng']] },
  ] as const;
  const courseRecords = [];
  for (const spec of courseSpecs) {
    const coverImageUrl = '/course-media/hanlearn-course-cover.svg';
    const demoVideoUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
    const course = await prisma.course.upsert({ where: { slug: spec.slug }, update: { title: spec.title, subtitle: spec.subtitle, summary: spec.subtitle, description: spec.description, coverImageUrl, coverImageAlt: `Ảnh đại diện khóa học ${spec.title}`, demoVideoUrl, demoVideoThumbnailUrl: coverImageUrl }, create: { slug: spec.slug, title: spec.title, subtitle: spec.subtitle, summary: spec.subtitle, description: spec.description, coverColor: spec.color, coverImageUrl, coverImageAlt: `Ảnh đại diện khóa học ${spec.title}`, demoVideoUrl, demoVideoThumbnailUrl: coverImageUrl, durationHours: spec.duration, levelId: spec.level.id, categoryId: spec.category.id, status: 'PUBLISHED' } });
    // Keep authored modules and lessons when the API container restarts. The
    // previous reset made production content disappear after every deploy.
    if (await prisma.module.count({ where: { courseId: course.id } })) {
      const firstLesson = await prisma.lesson.findFirst({ where: { module: { courseId: course.id } }, orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }] });
      if (firstLesson) courseRecords.push({ course, lesson: firstLesson });
      continue;
    }
    const lessonGroups = [spec.lessons.slice(0, 2), spec.lessons.slice(2)];
    for (const [moduleIndex, lessonGroup] of lessonGroups.entries()) {
      const module = await prisma.module.create({ data: { courseId: course.id, title: `Nhánh ${moduleIndex + 1} · ${moduleIndex === 0 ? 'Nền tảng' : 'Thực hành'}`, subtitle: moduleIndex === 0 ? 'Nắm kiến thức cốt lõi' : 'Củng cố qua bài luyện', sortOrder: moduleIndex + 1 } });
      for (const [sort, [lessonSlug, title, summary]] of lessonGroup.entries()) {
        const lessonIndex = moduleIndex * 2 + sort;
        const lesson = await prisma.lesson.create({ data: { moduleId: module.id, slug: lessonSlug, title, summary, durationMinutes: 12 + lessonIndex * 4, sortOrder: sort + 1, status: 'PUBLISHED', sections: { create: [{ type: 'INTRODUCTION', title: 'Khởi động', body: summary, sortOrder: 1 }, { type: 'VOCABULARY', title: 'Từ vựng trọng tâm', body: 'Nắm chắc những từ khóa trước khi luyện tập.', sortOrder: 2 }, { type: 'SUMMARY', title: 'Tổng kết', body: 'Ôn lại điều bạn vừa học và tiếp tục sang bài tiếp theo.', sortOrder: 3 }], }, lessonWords: { create: uniqueVocabulary.slice(lessonIndex * 5, lessonIndex * 5 + 8).map((word, index) => ({ vocabularyId: word.id, sortOrder: index + 1 })) }, speaking: { create: { promptCn: '你今天怎么样？', promptPy: 'Nǐ jīntiān zěnmeyàng?', promptVi: 'Hôm nay bạn thế nào?', sortOrder: 1 } }, reading: { create: { title: 'Một buổi sáng của Tiểu Minh', level: spec.level.name, passageCn: '小明每天早上七点起床。他吃完早饭以后去学校。', passagePy: 'Xiǎomíng měitiān zǎoshang qī diǎn qǐchuáng. Tā chī wán zǎofàn yǐhòu qù xuéxiào.', passageVi: 'Mỗi sáng Tiểu Minh thức dậy lúc bảy giờ. Sau khi ăn sáng, cậu ấy đi học.', sortOrder: 1, questions: { create: { prompt: '小明几点起床？', options: ['六点', '七点', '八点', '九点'], answer: '七点', explanation: 'Thông tin nằm ở câu đầu tiên.' } } } }, writing: { create: { promptVi: 'Tôi thích học tiếng Trung.', expectedCn: '我喜欢学习中文。', hint: '喜欢 + động từ để nói thích làm gì.', sortOrder: 1 } }, listening: { create: { title: 'Nghe và hiểu', type: 'MULTIPLE_CHOICE', transcript: '你叫什么名字？', translation: 'Bạn tên là gì?', sortOrder: 1, questions: { create: { prompt: 'Bạn nghe được câu nào?', options: ['你叫什么名字？', '你住在哪里？', '你喜欢什么？', '你是哪国人？'], answer: '你叫什么名字？' } } } }, quizzes: { create: { title: 'Kiểm tra nhanh', passingScore: 70, questions: { create: [{ prompt: '“谢谢” nghĩa là gì?', type: 'MULTIPLE_CHOICE', options: ['Xin chào', 'Cảm ơn', 'Tạm biệt', 'Xin lỗi'], sortOrder: 1, answers: { create: [{ answer: 'Cảm ơn', isCorrect: true }, { answer: 'Xin chào', isCorrect: false }] } }] } } } } });
        if (moduleIndex === 0 && sort === 0) courseRecords.push({ course, lesson });
      }
    }
  }

  // Give every seeded lesson a useful starter content outline without
  // overwriting blocks created by an admin.
  const seededLessons = await prisma.lesson.findMany({ select: { id: true, title: true, summary: true } });
  for (const lesson of seededLessons) {
    if (await prisma.lessonContentBlock.count({ where: { lessonId: lesson.id } })) continue;
    await prisma.lessonContentBlock.createMany({ data: [
      { lessonId: lesson.id, type: 'TEXT', title: 'Mục tiêu bài học', body: lesson.summary, sortOrder: 1 },
      { lessonId: lesson.id, type: 'CALLOUT', title: 'Mẹo học', body: 'Đọc to câu mẫu, nghe lại ít nhất hai lần và ghi chú một điều bạn muốn áp dụng hôm nay.', sortOrder: 2 },
    ] });
  }

  const achievements = [
    ['streak-7', '7 ngày bền bỉ', 'Duy trì chuỗi học trong 7 ngày.', '🔥', 100],
    ['words-100', 'Vocabulary Master', 'Học 100 từ vựng mới.', '📚', 200],
    ['listening-starter', 'Listening Starter', 'Hoàn thành 10 bài nghe.', '🎧', 120],
    ['hanzi-writer', 'Hanzi Writer', 'Luyện viết 20 chữ Hán.', '✍️', 150],
  ] as const;
  for (const [code, title, description, icon, xpReward] of achievements) await prisma.achievement.upsert({ where: { code }, update: {}, create: { code, title, description, icon, xpReward } });

  const passwords = await bcrypt.hash('DemoPass123!', 12);
  const demoUsers = [
    { email: 'admin@hanlearn.local', name: 'HanLearn Admin', role: adminRole },
    { email: 'teacher@hanlearn.local', name: 'Minh Anh', role: teacherRole },
    { email: 'student@hanlearn.local', name: 'Quyến', role: studentRole },
    { email: 'student2@hanlearn.local', name: 'Linh Nguyễn', role: studentRole },
    { email: 'student3@hanlearn.local', name: 'Nam Trần', role: studentRole },
  ];
  for (const demo of demoUsers) {
    const user = await prisma.user.upsert({ where: { email: demo.email }, update: { name: demo.name, passwordHash: passwords, status: 'ACTIVE' }, create: { email: demo.email, name: demo.name, passwordHash: passwords, profile: { create: { currentLevel: demo.role.code === 'student' ? 'HSK 1' : 'HSK 3', dailyTarget: 15 } }, streak: { create: { currentStreak: demo.email === 'student@hanlearn.local' ? 12 : 3, longestStreak: 18 } }, roles: { create: { roleId: demo.role.id } } } });
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: demo.role.id } }, update: {}, create: { userId: user.id, roleId: demo.role.id } });
    if (demo.email === 'student@hanlearn.local') {
      await prisma.experienceLog.deleteMany({ where: { userId: user.id } });
      await prisma.experienceLog.createMany({ data: [{ userId: user.id, amount: 900, reason: 'Hoàn thành bài học' }, { userId: user.id, amount: 850, reason: 'Daily challenge' }, { userId: user.id, amount: 680, reason: 'Ôn tập từ vựng' }] });
      const courseRecord = courseRecords[1];
      await prisma.userCourseProgress.upsert({ where: { userId_courseId: { userId: user.id, courseId: courseRecord.course.id } }, update: { progressPct: 68, status: 'IN_PROGRESS', lastLessonId: courseRecord.lesson.id }, create: { userId: user.id, courseId: courseRecord.course.id, progressPct: 68, status: 'IN_PROGRESS', lastLessonId: courseRecord.lesson.id } });
      await prisma.userLessonProgress.upsert({ where: { userId_lessonId: { userId: user.id, lessonId: courseRecord.lesson.id } }, update: { progressPct: 80, status: 'IN_PROGRESS' }, create: { userId: user.id, lessonId: courseRecord.lesson.id, progressPct: 80, status: 'IN_PROGRESS' } });
      for (const [wordIndex, word] of uniqueVocabulary.slice(0, 14).entries()) await prisma.userVocabularyProgress.upsert({ where: { userId_vocabularyId: { userId: user.id, vocabularyId: word.id } }, update: {}, create: { userId: user.id, vocabularyId: word.id, status: wordIndex % 2 === 0 ? 'KNOWN' : 'LEARNING', nextReviewAt: new Date(Date.now() - 60 * 60 * 1000) } });
      const achievement = await prisma.achievement.findUniqueOrThrow({ where: { code: 'streak-7' } });
      await prisma.userAchievement.upsert({ where: { userId_achievementId: { userId: user.id, achievementId: achievement.id } }, update: {}, create: { userId: user.id, achievementId: achievement.id } });
      await prisma.notification.deleteMany({ where: { userId: user.id, title: 'Bạn có từ cần ôn hôm nay', type: 'REVIEW' } });
      await prisma.notification.create({ data: { userId: user.id, title: 'Bạn có từ cần ôn hôm nay', body: 'Dành 5 phút để giữ vững chuỗi học 12 ngày nhé.', type: 'REVIEW' } });
    }
  }
  console.log('HanLearn seed completed. Demo password: DemoPass123!');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
