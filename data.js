// ===== Dữ liệu mẫu của StyleHer =====
// Ảnh: Unsplash (miễn phí bản quyền). Muốn thay ảnh: đổi id ảnh, hoặc đặt đường dẫn ảnh
// của bạn (ví dụ "images/ao-blouse.jpg") vào trường `img`.
// Link mua hàng: dẫn tới trang tìm kiếm của sàn TMĐT, giá là giá tham khảo.

const STYLEHER_DATA = (() => {
  const shopee = (q) => `https://shopee.vn/search?keyword=${encodeURIComponent(q)}`;
  const lazada = (q) => `https://www.lazada.vn/catalog/?q=${encodeURIComponent(q)}`;

  // Bối cảnh (シーン) dùng cho bộ lọc gợi ý phối đồ
  const scenes = [
    { id: "dilam", name: "Đi làm", icon: "briefcase" },
    { id: "dichoi", name: "Đi chơi", icon: "bag" },
    { id: "henho", name: "Hẹn hò", icon: "heart" },
    { id: "dutiec", name: "Dự tiệc", icon: "sparkle" },
    { id: "dulich", name: "Du lịch", icon: "plane" },
    { id: "onha", name: "Ở nhà", icon: "home" },
  ];

  // Độ tuổi (年代) và phong cách (テイスト)
  const ages = [
    { id: "20s", name: "20+" },
    { id: "30s", name: "30+" },
    { id: "40s", name: "40+" },
  ];
  const tastes = [
    { id: "thanhlich", name: "Thanh lịch" },
    { id: "nangdong", name: "Năng động" },
    { id: "ngotngao", name: "Ngọt ngào" },
    { id: "toigian", name: "Tối giản" },
    { id: "quyenru", name: "Quyến rũ" },
  ];

  const categories = [
    { id: "all", name: "Tất cả" },
    { id: "ao", name: "Áo" },
    { id: "quan", name: "Quần" },
    { id: "vay", name: "Váy/Đầm" },
    { id: "phukien", name: "Phụ kiện" },
    { id: "giay", name: "Giày dép" },
    { id: "tuixach", name: "Túi xách" },
  ];

  const products = [
    { id: "p01", name: "Áo blouse tay phồng", cat: "ao", color: "Trắng", price: 450000, shop: "Shopee", img: "1600884350802-c6d0bf14dcc6", url: shopee("áo blouse tay phồng trắng") },
    { id: "p02", name: "Áo sơ mi bèo nhún", cat: "ao", color: "Trắng", price: 390000, shop: "Lazada", img: "1778826971124-c5ee892e266e", url: lazada("áo sơ mi bèo nhún nữ") },
    { id: "p03", name: "Blazer hồng pastel", cat: "ao", color: "Hồng", price: 890000, shop: "Shopee", img: "1773859096354-7ca7b4f41bc0", url: shopee("blazer hồng pastel nữ") },
    { id: "p04", name: "Áo khoác trench coat be", cat: "ao", color: "Be", price: 1290000, shop: "Lazada", img: "1648066380643-675d30c3cd17", url: lazada("áo trench coat nữ màu be") },
    { id: "p05", name: "Quần jeans ống rộng", cat: "quan", color: "Xanh", price: 590000, shop: "Shopee", img: "1714143136372-ddaf8b606da7", url: shopee("quần jeans ống rộng nữ") },
    { id: "p06", name: "Quần jeans suông", cat: "quan", color: "Xanh", price: 520000, shop: "Lazada", img: "1602293589930-45aad59ba3ab", url: lazada("quần jeans suông nữ") },
    { id: "p07", name: "Quần âu ống đứng xanh rêu", cat: "quan", color: "Xanh rêu", price: 480000, shop: "Shopee", img: "1599505043552-fa95de5548ac", url: shopee("quần âu nữ ống đứng xanh rêu") },
    { id: "p08", name: "Đầm midi hoa nhí", cat: "vay", color: "Hoa", price: 520000, shop: "Shopee", img: "1768982597225-9dadb37f3db7", url: shopee("đầm midi hoa nhí") },
    { id: "p09", name: "Đầm hai dây đen", cat: "vay", color: "Đen", price: 650000, shop: "Lazada", img: "1594739033447-80ab21e24b4c", url: lazada("đầm hai dây đen dự tiệc") },
    { id: "p10", name: "Đầm lụa hai dây màu be", cat: "vay", color: "Be", price: 720000, shop: "Shopee", img: "1733043014211-8d699f6a82b1", url: shopee("đầm lụa hai dây màu be") },
    { id: "p11", name: "Túi xách da basic", cat: "tuixach", color: "Đen", price: 1590000, shop: "Lazada", img: "1614179689702-355944cd0918", url: lazada("túi xách da nữ công sở đen") },
    { id: "p12", name: "Túi xếp ly mini", cat: "tuixach", color: "Đen", price: 690000, shop: "Shopee", img: "1761646237988-79635fce1841", url: shopee("túi xếp ly mini nữ") },
    { id: "p13", name: "Túi đeo vai quai cứng", cat: "tuixach", color: "Đen", price: 890000, shop: "Lazada", img: "1702326626601-74d2e86922b4", url: lazada("túi đeo vai nữ quai cứng") },
    { id: "p14", name: "Giày sneaker trắng", cat: "giay", color: "Trắng", price: 690000, shop: "Shopee", img: "1544441892-794166f1e3be", url: shopee("giày sneaker trắng nữ") },
    { id: "p15", name: "Giày cao gót mũi nhọn", cat: "giay", color: "Be", price: 550000, shop: "Lazada", img: "1782232460628-ab38d15bd4af", url: lazada("giày cao gót mũi nhọn màu be") },
    { id: "p16", name: "Sandal quai mảnh", cat: "giay", color: "Be", price: 420000, shop: "Shopee", img: "1770757685173-94df47a52b68", url: shopee("sandal quai mảnh nữ") },
    { id: "p17", name: "Khuyên tai vàng xoắn", cat: "phukien", color: "Vàng", price: 250000, shop: "Shopee", img: "1617038260897-41a1f14a8ca0", url: shopee("khuyên tai vàng xoắn") },
    { id: "p18", name: "Kính mát gọng đen", cat: "phukien", color: "Đen", price: 320000, shop: "Lazada", img: "1572635196237-14b3f281503f", url: lazada("kính mát nữ gọng đen") },
    { id: "p19", name: "Dây chuyền vàng mảnh", cat: "phukien", color: "Vàng", price: 380000, shop: "Shopee", img: "1633810542706-90e5ff7557be", url: shopee("dây chuyền vàng mảnh nữ") },
    { id: "p20", name: "Vòng tay ngọc trai", cat: "phukien", color: "Trắng", price: 290000, shop: "Lazada", img: "1704957205218-d436eac4c607", url: lazada("vòng tay ngọc trai") },
  ];

  const trends = [
    {
      id: "quiet-luxury",
      name: "Quiet Luxury",
      sub: "Sang trọng tinh tế",
      img: "1751399566412-ad1194241c5c",
      gallery: ["1618244985759-a8a1dc26bce3", "1618333452884-5c8d211ed2ad", "1648066380643-675d30c3cd17"],
      hot: 94,
      season: "Thu – Đông 2026",
      posts: 120,
      ages: ["20s", "30s", "40s"],
      tastes: ["thanhlich", "toigian"],
      desc: "Sang trọng mà không phô trương: chất liệu tốt, phom dáng chuẩn, bảng màu trung tính như be, nâu camel, kem và xám. Không logo lớn, không hoạ tiết rối mắt.",
      points: ["Bảng màu trung tính: be, camel, kem, xám tro", "Chất liệu cao cấp: len, lụa, dạ, da mềm", "Phom dáng đứng, đường may gọn gàng"],
      tips: ["Phối cả cây một tông màu (tone-sur-tone) để trông cao và sang hơn", "Một chiếc áo khoác dạ be có thể mặc với quần âu, jeans hay váy lụa", "Phụ kiện vàng mảnh, không chọn đồ quá nhiều chi tiết"],
      products: ["p04", "p10", "p11", "p19"],
    },
    {
      id: "office-chic",
      name: "Office Chic",
      sub: "Thanh lịch nơi công sở",
      img: "1584273143981-41c073dfe8f8",
      gallery: ["1637151774410-bbe2f3eb393d", "1599505043552-fa95de5548ac", "1600884350802-c6d0bf14dcc6"],
      hot: 88,
      season: "Quanh năm",
      posts: 98,
      ages: ["20s", "30s", "40s"],
      tastes: ["thanhlich", "toigian"],
      desc: "Trang phục công sở hiện đại: vẫn chỉn chu nhưng thoải mái, dễ di chuyển và có điểm nhấn cá tính thay vì bộ vest cứng nhắc.",
      points: ["Blazer dáng rộng thay vest ôm", "Quần âu ống đứng hoặc ống suông", "Áo blouse, sơ mi có chi tiết tay phồng, bèo nhún"],
      tips: ["Blazer + áo blouse + quần âu: công thức an toàn cho ngày họp quan trọng", "Đổi blazer sang cardigan mỏng khi đi làm ngày thường", "Chọn túi xách cứng cáp, đủ đựng laptop"],
      products: ["p01", "p07", "p11", "p15"],
    },
    {
      id: "y2k",
      name: "Y2K Comeback",
      sub: "Cá tính & năng động",
      img: "1761979680036-38a7f85b2f0b",
      gallery: ["1760724850043-43eefff20a2a", "1758676171646-14da2df79b9a", "1786114940453-095a0a40f91d"],
      hot: 81,
      season: "Hè – Thu 2026",
      posts: 76,
      ages: ["20s"],
      tastes: ["nangdong"],
      desc: "Phong cách những năm 2000 trở lại: áo croptop, chân váy kẻ caro, jeans cạp trễ, túi mini và phụ kiện màu sắc.",
      points: ["Áo croptop, áo baby tee", "Chân váy xếp ly kẻ caro, jeans ống rộng", "Túi mini, kính mát, phụ kiện màu kẹo ngọt"],
      tips: ["Chỉ chọn một món 'Y2K' làm điểm nhấn, phần còn lại giữ đơn giản", "Jeans ống rộng + áo croptop + sneaker trắng: dễ mặc nhất", "Hợp đi chơi, đi cafe cuối tuần hơn là đi làm"],
      products: ["p05", "p14", "p12", "p18"],
    },
    {
      id: "korean-minimal",
      name: "Korean Minimal",
      sub: "Đơn giản nhưng cuốn hút",
      img: "1541823709867-1b206113eafd",
      gallery: ["1635353692890-80a6b95add47", "1553073441-48924e457d5c", "1712848399333-f76a5db5f4c2"],
      hot: 90,
      season: "Quanh năm",
      posts: 112,
      ages: ["20s", "30s"],
      tastes: ["toigian", "ngotngao"],
      desc: "Tối giản kiểu Hàn: phom rộng vừa phải, màu nhã, phối nhiều lớp mỏng. Nhìn nhẹ nhàng, trẻ trung mà vẫn chỉn chu.",
      points: ["Áo khoác dáng dài màu pastel hoặc xám", "Sơ mi trắng, quần suông, chân váy dài", "Phối layer: áo trong mỏng + khoác ngoài"],
      tips: ["Giữ tối đa 3 màu trong một bộ đồ", "Áo khoác dài giúp dáng người thon, cao hơn", "Giày bệt hoặc sneaker để tổng thể nhẹ nhàng"],
      products: ["p02", "p06", "p14", "p20"],
    },
    {
      id: "pink-2026",
      name: "Color Trend 2026",
      sub: "Sắc hồng lên ngôi",
      img: "1773859096354-7ca7b4f41bc0",
      gallery: ["1770526406562-6ebb239044c8", "1774807926607-4ff8ab845a00", "1788185881954-200704d64eb8"],
      hot: 86,
      season: "Xuân – Hè 2026",
      posts: 89,
      ages: ["20s", "30s"],
      tastes: ["ngotngao", "quyenru"],
      desc: "Hồng pastel đến hồng đậm xuất hiện khắp nơi: blazer, sơ mi, phụ kiện. Màu hồng giúp gương mặt tươi tắn và tạo điểm nhấn nữ tính.",
      points: ["Blazer hoặc sơ mi hồng làm điểm nhấn", "Kết hợp hồng với trắng, be hoặc xám", "Hồng đậm cho người thích nổi bật"],
      tips: ["Mới thử màu hồng? Bắt đầu với phụ kiện hoặc áo trong", "Hồng + trắng: tươi sáng; hồng + nâu: trưởng thành, sang", "Người da ngăm hợp hồng đậm hơn hồng pastel"],
      products: ["p03", "p01", "p17", "p16"],
    },
    {
      id: "romantic-floral",
      name: "Romantic Floral",
      sub: "Váy hoa lãng mạn",
      img: "1762154057377-cc9d3dd6900c",
      gallery: ["1768982597225-9dadb37f3db7", "1733043014211-8d699f6a82b1", "1517970640957-23d07d5ed08c"],
      hot: 83,
      season: "Xuân – Hè 2026",
      posts: 64,
      ages: ["20s", "30s", "40s"],
      tastes: ["ngotngao"],
      desc: "Váy hoa nhí, váy lụa bay bổng quay lại với phom dáng midi thanh lịch, phù hợp cả đi chơi, hẹn hò và du lịch.",
      points: ["Đầm midi hoa nhí, cổ vuông hoặc cổ V", "Chất liệu nhẹ: voan, lụa, cotton", "Tông màu kem, hồng nhạt, xanh pastel"],
      tips: ["Khoác thêm blazer hoặc cardigan để mặc đi làm", "Sandal quai mảnh hoặc giày búp bê giúp tổng thể nữ tính", "Người thấp nên chọn đầm dài qua gối một chút, eo cao"],
      products: ["p08", "p10", "p16", "p17"],
    },
  ];

  const outfits = [
    { id: "o01", scene: "dilam", title: "Thanh lịch và chuyên nghiệp", img: "1637151774410-bbe2f3eb393d", items: ["p11", "p19", "p15"], ages: ["20s", "30s", "40s"], tastes: ["thanhlich"], desc: "Đầm đen dáng suông kết hợp túi da basic và giày mũi nhọn, gọn gàng cho cả ngày họp lẫn gặp khách hàng.", tips: ["Thêm blazer be khi phòng lạnh", "Dây chuyền vàng mảnh giúp gương mặt sáng hơn"] },
    { id: "o02", scene: "dilam", title: "Sơ mi trắng & quần âu xanh rêu", img: "1599505043552-fa95de5548ac", items: ["p01", "p07", "p15"], ages: ["20s", "30s"], tastes: ["thanhlich", "toigian"], desc: "Công thức công sở không bao giờ lỗi mốt, màu xanh rêu tạo điểm nhấn nhẹ nhàng.", tips: ["Sơ vin áo để đôi chân dài hơn", "Đổi sang sneaker trắng cho ngày thứ Sáu"] },
    { id: "o03", scene: "dichoi", title: "Năng động dạo phố cuối tuần", img: "1619086303291-0ef7699e4b31", items: ["p04", "p05", "p14"], ages: ["20s", "30s"], tastes: ["nangdong"], desc: "Trench coat be khoác ngoài cây trắng, thoải mái đi bộ cả ngày mà vẫn có gu.", tips: ["Xắn tay áo khoác để trông trẻ trung", "Túi đeo chéo nhỏ giúp rảnh tay"] },
    { id: "o04", scene: "dichoi", title: "Jeans và áo trắng basic", img: "1598554747436-c9293d6a588f", items: ["p02", "p06", "p14"], ages: ["20s"], tastes: ["nangdong", "toigian"], desc: "Đơn giản nhất nhưng chưa bao giờ hết đẹp: jeans xanh, áo trắng và sneaker.", tips: ["Thêm kính mát và khuyên tai vàng là đủ nổi bật"] },
    { id: "o05", scene: "henho", title: "Ngọt ngào cho buổi hẹn hò", img: "1762154057377-cc9d3dd6900c", items: ["p08", "p16", "p17"], ages: ["20s", "30s"], tastes: ["ngotngao"], desc: "Đầm hoa nhí màu kem, sandal quai mảnh và khuyên tai vàng: nhẹ nhàng, nữ tính.", tips: ["Buổi tối mang thêm cardigan mỏng", "Chọn son hồng đất hợp với tông váy"] },
    { id: "o06", scene: "henho", title: "Đầm hoa dáng dài thanh lịch", img: "1616313253719-c46514cddee1", items: ["p08", "p15", "p19"], ages: ["30s", "40s"], tastes: ["ngotngao", "thanhlich"], desc: "Đầm hoa tay dài giúp tổng thể thanh lịch, hợp hẹn hò ở nhà hàng.", tips: ["Buộc tóc thấp để lộ dây chuyền", "Giày cao gót be giúp chân dài hơn"] },
    { id: "o07", scene: "dutiec", title: "Quyến rũ dự tiệc tối", img: "1594739033447-80ab21e24b4c", items: ["p09", "p12", "p15"], ages: ["20s", "30s"], tastes: ["quyenru"], desc: "Đầm hai dây đen là món đồ phải có: chỉ cần thêm túi nhỏ và giày cao gót.", tips: ["Khuyên tai to bản thay cho dây chuyền", "Khoác blazer khi ra về"] },
    { id: "o08", scene: "dutiec", title: "Đầm lụa be sang trọng", img: "1733043014211-8d699f6a82b1", items: ["p10", "p13", "p16"], ages: ["30s", "40s"], tastes: ["quyenru", "thanhlich"], desc: "Chất lụa bóng nhẹ màu be cho tiệc cưới, tiệc công ty, không bao giờ lấn át cô dâu.", tips: ["Vòng tay ngọc trai rất hợp chất lụa", "Chọn nội y không đường may"] },
    { id: "o09", scene: "dulich", title: "Bay bổng cho chuyến du lịch", img: "1517970640957-23d07d5ed08c", items: ["p08", "p16", "p18"], ages: ["20s", "30s", "40s"], tastes: ["ngotngao"], desc: "Váy hoa chất nhẹ, không nhăn, lên ảnh đẹp ở biển, đồng cỏ hay phố cổ.", tips: ["Kính mát và mũ rộng vành chống nắng", "Mang giày đế bệt để đi bộ nhiều"] },
    { id: "o10", scene: "dulich", title: "Sơ mi trắng & chân váy midi", img: "1595272251257-1bbe120103d5", items: ["p02", "p14", "p18"], ages: ["20s", "30s"], tastes: ["toigian", "nangdong"], desc: "Sơ mi trắng rộng phối chân váy midi, mát mẻ và dễ mặc trong ngày nắng.", tips: ["Buộc vạt áo để có eo", "Sneaker trắng đi được cả ngày"] },
    { id: "o11", scene: "onha", title: "Thoải mái mà vẫn xinh ở nhà", img: "1680690517143-d813ac08cd13", items: ["p02", "p06", "p20"], ages: ["20s", "30s", "40s"], tastes: ["toigian"], desc: "Cây trắng rộng rãi chất cotton: ở nhà thoải mái, có khách đến vẫn chỉn chu.", tips: ["Chọn chất liệu cotton, linen thấm hút tốt"] },
    { id: "o12", scene: "onha", title: "Đầm suông nhẹ nhàng", img: "1584287981937-67ab60932edf", items: ["p10", "p16", "p20"], ages: ["20s", "30s"], tastes: ["ngotngao", "toigian"], desc: "Đầm hai dây trắng dáng suông, mặc ở nhà hay ra ngõ mua đồ đều đẹp.", tips: ["Khoác thêm sơ mi mỏng khi ra ngoài"] },
    { id: "o13", scene: "dilam", title: "Blazer đen quyền lực", img: "1584273143981-41c073dfe8f8", items: ["p01", "p11", "p15"], ages: ["30s", "40s"], tastes: ["thanhlich"], desc: "Blazer và quần âu đen cùng tông giúp dáng cao, gọn và chuyên nghiệp cho ngày thuyết trình.", tips: ["Áo blouse trắng bên trong làm sáng tổng thể", "Túi da cứng cáp tăng vẻ quyền lực"] },
    { id: "o14", scene: "dilam", title: "Suit nâu camel sang trọng", img: "1751399566412-ad1194241c5c", items: ["p02", "p13", "p19"], ages: ["30s", "40s"], tastes: ["thanhlich", "toigian"], desc: "Bộ suit màu camel đúng tinh thần Quiet Luxury: nhã nhặn, sang mà không phô trương.", tips: ["Chọn áo trong màu kem hoặc trắng ngà", "Dây chuyền vàng mảnh là đủ, không cần thêm"] },
    { id: "o15", scene: "dichoi", title: "Hồng pastel dạo phố", img: "1770526406562-6ebb239044c8", items: ["p03", "p14", "p12"], ages: ["20s"], tastes: ["ngotngao", "nangdong"], desc: "Áo hồng phối quần trắng tươi tắn, hợp đi cafe, đi mua sắm cùng bạn bè.", tips: ["Giữ phụ kiện màu trung tính để màu hồng nổi bật", "Sneaker trắng cho cả ngày di chuyển"] },
    { id: "o16", scene: "dichoi", title: "Sơ mi & chân váy kẻ caro", img: "1786114940453-095a0a40f91d", items: ["p02", "p12", "p14"], ages: ["20s"], tastes: ["nangdong"], desc: "Chân váy kẻ caro và túi đeo chéo: trẻ trung, hơi hướng học đường kiểu Y2K.", tips: ["Tất cao cổ và sneaker để tăng vẻ năng động"] },
    { id: "o17", scene: "henho", title: "Váy hoa tối màu quyến rũ", img: "1511130558090-00af810c21b1", items: ["p08", "p15", "p18"], ages: ["20s", "30s"], tastes: ["quyenru", "ngotngao"], desc: "Váy hoa nền đen vừa nữ tính vừa bí ẩn, hợp hẹn hò buổi tối.", tips: ["Kính mát cho buổi chiều, tháo ra khi vào nhà hàng", "Son đỏ trầm hợp nền váy tối màu"] },
    { id: "o18", scene: "henho", title: "Đầm hoa nhí dáng dài", img: "1768982597225-9dadb37f3db7", items: ["p08", "p16", "p20"], ages: ["30s", "40s"], tastes: ["ngotngao"], desc: "Dáng dài kín đáo mà vẫn mềm mại, hợp hẹn hò cuối tuần hoặc đi ăn cùng gia đình.", tips: ["Vòng tay ngọc trai tăng vẻ dịu dàng"] },
    { id: "o19", scene: "dutiec", title: "Đầm đen hai dây tối giản", img: "1618037208874-021263b58d69", items: ["p09", "p13", "p19"], ages: ["30s", "40s"], tastes: ["quyenru", "toigian"], desc: "Thiết kế tối giản, đường cắt gọn: sang trọng cho tiệc tối mà không cần cầu kỳ.", tips: ["Tóc búi thấp và dây chuyền vàng mảnh"] },
    { id: "o20", scene: "dutiec", title: "Váy đen trẻ trung", img: "1656284518334-710b60cd63a0", items: ["p09", "p12", "p17"], ages: ["20s"], tastes: ["quyenru"], desc: "Váy đen dáng ngắn cho tiệc sinh nhật, tiệc cuối năm cùng bạn bè.", tips: ["Khuyên tai vàng nổi bật trên nền đen"] },
    { id: "o21", scene: "dulich", title: "Đầm pastel dạo phố cổ", img: "1759992878772-e83a691a6d8f", items: ["p10", "p16", "p18"], ages: ["20s", "30s"], tastes: ["ngotngao"], desc: "Màu pastel nhẹ nhàng rất ăn ảnh với tường vàng, phố cổ và quán cafe.", tips: ["Mang thêm khăn mỏng khi vào chùa, đền"] },
    { id: "o22", scene: "dulich", title: "Trench coat cho chuyến đi mùa thu", img: "1618333453525-81f8582b1a3d", items: ["p04", "p06", "p14"], ages: ["30s", "40s"], tastes: ["thanhlich"], desc: "Trench coat khoác ngoài giữ ấm, chống gió và vẫn thanh lịch khi đi Đà Lạt, Sa Pa hay Hàn Quốc.", tips: ["Mặc nhiều lớp mỏng để dễ cởi ra khi trời ấm"] },
    { id: "o23", scene: "onha", title: "Xanh nhẹ nhàng cuối tuần", img: "1553073441-48924e457d5c", items: ["p02", "p06", "p16"], ages: ["20s"], tastes: ["toigian", "ngotngao"], desc: "Áo xanh nhạt trễ vai và quần suông: thoải mái ở nhà, tiện ra ngoài mua đồ.", tips: ["Chất liệu thun gân mềm, co giãn tốt"] },
    { id: "o24", scene: "onha", title: "Tối giản với tông đen", img: "1635353692890-80a6b95add47", items: ["p01", "p06", "p20"], ages: ["30s", "40s"], tastes: ["toigian"], desc: "Áo đen trơn phom rộng, dễ phối và che khuyết điểm, ở nhà vẫn gọn gàng.", tips: ["Thêm vòng tay khi có khách đến chơi"] },
  ];

  const shops = [
    { name: "Leika", url: "https://leika.vn/", type: "Thời trang nữ" },
    { name: "Routine", url: "https://routine.vn/", type: "Thời trang basic" },
    { name: "IVY moda", url: "https://ivymoda.com/", type: "Công sở" },
    { name: "Canifa", url: "https://canifa.com/", type: "Basic gia đình" },
    { name: "Pedro", url: "https://www.pedroshoes.com/vn", type: "Giày & túi" },
    { name: "H&M", url: "https://www2.hm.com/vi_vn/", type: "Thời trang nhanh" },
    { name: "Zara", url: "https://www.zara.com/vn/", type: "Thời trang nhanh" },
    { name: "Uniqlo", url: "https://www.uniqlo.com/vn/vi/", type: "Basic Nhật Bản" },
    { name: "Shopee", url: "https://shopee.vn/", type: "Sàn TMĐT" },
    { name: "Lazada", url: "https://www.lazada.vn/", type: "Sàn TMĐT" },
  ];

  const posts = [
    {
      id: "a01",
      title: "6 xu hướng thời trang Thu – Đông 2026 bạn không nên bỏ lỡ",
      tag: "Xu hướng",
      date: "2026-09-18",
      img: "1618333453296-9e35280fd6b1",
      excerpt: "Từ Quiet Luxury đến sắc hồng, đây là những xu hướng sẽ theo bạn suốt mùa lạnh.",
      body: ["Mùa Thu – Đông năm nay, các nhà mốt hướng tới sự tinh tế thay vì phô trương. Quiet Luxury với bảng màu trung tính tiếp tục dẫn đầu, trong khi sắc hồng mang lại điểm nhấn tươi sáng.", "Áo khoác trench coat màu be là món đồ đáng đầu tư nhất: mặc được cả đi làm lẫn đi chơi, phối với jeans, quần âu hay váy lụa.", "Nếu chỉ mua một món mới trong mùa này, hãy chọn một chiếc blazer dáng rộng: nó giúp mọi bộ đồ basic trông 'có gu' ngay lập tức."],
    },
    {
      id: "a02",
      title: "Cách phối đồ basic nhưng vẫn có gu",
      tag: "Tips phối đồ",
      date: "2026-09-15",
      img: "1603400521630-9f2de124b33b",
      excerpt: "Chỉ với 10 món cơ bản, bạn có thể tạo ra hơn 30 bộ trang phục khác nhau.",
      body: ["Tủ đồ con nhộng (capsule wardrobe) gồm những món cơ bản dễ phối: sơ mi trắng, áo thun trơn, jeans xanh, quần âu, chân váy midi, blazer, trench coat, đầm đen, sneaker trắng và giày cao gót màu nude.", "Bí quyết là giữ bảng màu trung tính rồi thêm điểm nhấn bằng phụ kiện: khuyên tai vàng, túi màu, khăn lụa.", "Mỗi tuần thử một cách phối mới và chụp lại để tạo 'sổ tay phong cách' của riêng bạn."],
    },
    {
      id: "a03",
      title: "Mua sắm thông minh: chọn đồ theo dáng người",
      tag: "Gợi ý shop",
      date: "2026-09-10",
      img: "1441984904996-e0b6ba687e04",
      excerpt: "Hiểu dáng người giúp bạn mua ít hơn nhưng mặc đẹp hơn.",
      body: ["Dáng người quả lê nên chọn áo có chi tiết ở vai, quần ống rộng. Dáng quả táo hợp với đầm suông và cổ V. Dáng chữ nhật nên tạo eo bằng thắt lưng hoặc sơ vin.", "Trước khi mua online, hãy đo số đo thực tế và so với bảng size của từng shop, đừng chỉ chọn theo size quen.", "Đọc đánh giá có ảnh thật của người mua và ưu tiên shop có chính sách đổi trả rõ ràng."],
    },
    {
      id: "a04",
      title: "Trang phục công sở: 7 set đồ vừa đẹp vừa thoải mái",
      tag: "Công sở",
      date: "2026-09-05",
      img: "1560220980-b0d2f9b026f1",
      excerpt: "Đi làm cả tuần không lặp lại mà vẫn thoải mái di chuyển.",
      body: ["Thứ Hai: blazer + sơ mi trắng + quần âu. Thứ Ba: đầm suông đen + túi da. Thứ Tư: áo blouse tay phồng + chân váy midi.", "Thứ Năm: cardigan + quần ống đứng. Thứ Sáu: jeans ống suông + sơ mi + sneaker trắng.", "Chỉ cần 2 đôi giày (cao gót nude và sneaker trắng) cùng 1 túi da basic là đủ cho cả tuần."],
    },
  ];

  const community = [
    "1618333453525-81f8582b1a3d",
    "1618333453026-596543cca7a7",
    "1511111928333-046ec1d3bef6",
    "1635353775931-1a6464be72cb",
    "1770526406562-6ebb239044c8",
    "1758274251689-a1d85909bc23",
    "1778826971124-c5ee892e266e",
    "1712848399333-f76a5db5f4c2",
  ];

  const heroSlides = [
    { img: "1758272420960-0e615980f864", title: "Thời trang<br>dễ hơn,<br>đẹp hơn mỗi ngày", text: "Cập nhật xu hướng, gợi ý phối đồ, khám phá shop yêu thích – tất cả trong một nơi dành riêng cho bạn." },
    { img: "1618333453296-9e35280fd6b1", title: "Quiet Luxury<br>mùa Thu – Đông", text: "Sang trọng mà không phô trương: bảng màu be, camel và những chiếc áo khoác dáng dài." },
    { img: "1619086303291-0ef7699e4b31", pos: "center 25%", title: "Mặc đẹp<br>không cần nghĩ nhiều", text: "Chọn bối cảnh, xem bộ phối gợi ý và mua ngay món đồ bạn thích." },
  ];

  return { scenes, ages, tastes, categories, products, trends, outfits, shops, posts, community, heroSlides };
})();
