import re
from typing import Dict, Any, List
from app.schemas.ai_schemas import (
    ChatResponse, ChatbotEquipment,
    QuotationSuggestResponse, SuggestedQuotationItem
)

def generate_smart_suggestion(req: dict) -> QuotationSuggestResponse:
    area_input = float(req.get('area_sqm', 100))
    floors = max(1, int(req.get('floor_count', 1)))
    rooms_input = max(1, int(req.get('room_count', 1)))
    
    # Calculate total area & total rooms
    total_area = area_input if area_input >= 50 else area_input * floors
    total_rooms = rooms_input if rooms_input >= floors else rooms_input * floors
    
    risk = str(req.get('risk_level', 'Trung bình')).lower()
    btype = str(req.get('building_type', 'Nhà ở gia đình'))

    items = []
    
    # 1. Powder extinguishers: minimum 2 per floor or 1 per 50m² total area
    ext_abc_qty = max(2 * floors, int(total_area / 50))
    items.append(SuggestedQuotationItem(
        item_code="EXT-ABC-4KG",
        quantity=ext_abc_qty,
        rationale=f"Đảm bảo mật độ bình chữa cháy bột ABC 4kg theo TCVN 3890:2023 (tối thiểu 2 bình/tầng cho tổng diện tích {total_area}m²)."
    ))

    # 2. CO2 extinguishers: for electrical panels / tech rooms (minimum 1 per floor)
    ext_co2_qty = max(1 * floors, 1)
    items.append(SuggestedQuotationItem(
        item_code="EXT-CO2-3KG",
        quantity=ext_co2_qty,
        rationale="Bố trí tại khu vực tủ điện chính và phòng máy kỹ thuật để dập tắt sự cố điện."
    ))

    # 3. Smoke detectors: 1 per room + corridors (approx 1 per 40m²)
    smoke_qty = max(total_rooms, int(total_area / 40))
    items.append(SuggestedQuotationItem(
        item_code="DET-SMOKE-WIRE",
        quantity=smoke_qty,
        rationale=f"Lắp đặt đầu báo khói quang không dây tại các phòng và hành lang (định mức 1 đầu/40m² sàn)."
    ))

    # 4. Heat detector for kitchen or boiler/generator area
    heat_qty = max(1, floors)
    items.append(SuggestedQuotationItem(
        item_code="DET-HEAT-WIRE",
        quantity=heat_qty,
        rationale="Bố trí đầu báo nhiệt gia tăng tại khu vực bếp nấu chống báo giả do khói nấu ăn."
    ))

    # 5. Fire alarm panel, bells and buttons
    if floors >= 2 or total_area >= 120 or "cao" in risk or "kho" in btype.lower() or "xưởng" in btype.lower():
        panel_code = "ALM-PANEL-8" if floors >= 3 or total_area >= 250 else "ALM-PANEL-4"
        items.append(SuggestedQuotationItem(
            item_code=panel_code,
            quantity=1,
            rationale=f"Tủ trung tâm báo cháy Hochiki phân vùng quản lý và kích hoạt liên động cảnh báo toàn tòa nhà."
        ))
        items.append(SuggestedQuotationItem(
            item_code="ALM-BELL",
            quantity=floors,
            rationale=f"Chuông báo cháy 90dB lắp tại cầu thang mỗi tầng ({floors} tầng) cảnh báo khẩn cấp."
        ))
        items.append(SuggestedQuotationItem(
            item_code="ALM-BUTTON",
            quantity=floors,
            rationale="Nút nhấn khẩn cấp báo cháy bố trí cạnh lối thoát hiểm mỗi tầng."
        ))

    # 6. Exit and Emergency lights (2 per floor for staircases and main exits)
    exit_qty = max(2 * floors, 2)
    items.append(SuggestedQuotationItem(
        item_code="DEN-EXIT",
        quantity=exit_qty,
        rationale="Đèn EXIT chỉ dẫn lối thoát nạn 2 mặt đạt chuẩn PCCC tại các cửa ra và buồng thang bộ."
    ))
    items.append(SuggestedQuotationItem(
        item_code="DEN-SCS",
        quantity=exit_qty,
        rationale="Đèn sự cố mắt ếch tự động bật sáng 2 giờ khi mất điện phục vụ thoát nạn."
    ))

    # 7. Sprinkler & steel piping if warehouse/factory or high risk & large area
    if "kho" in btype.lower() or "xưởng" in btype.lower() or ("cao" in risk and total_area >= 200):
        sprinkler_qty = max(15, int(total_area / 12))
        items.append(SuggestedQuotationItem(
            item_code="SPK-NOZZLE-68",
            quantity=sprinkler_qty,
            rationale=f"Hệ thống chữa cháy tự động Sprinkler 68°C bảo vệ diện tích {total_area}m² ({sprinkler_qty} đầu phun)."
        ))
        pipe_qty = max(35, int(total_area / 4))
        items.append(SuggestedQuotationItem(
            item_code="PIPE-STEEL-DN50",
            quantity=pipe_qty,
            rationale=f"Hệ thống ống thép chịu áp lực cao dẫn nước chữa cháy DN50 ({pipe_qty} mét)."
        ))

    conf = 0.95 if "cao" in risk else (0.92 if "trung" in risk else 0.88)

    return QuotationSuggestResponse(
        suggested_items=items,
        equipment_cost=0.0,
        installation_cost=0.0,
        survey_cost=0.0,
        min_price_range=0.0,
        max_price_range=0.0,
        assumptions=[
            f"Mặt bằng {btype} gồm {floors} tầng, tổng diện tích sàn {total_area}m² ({total_rooms} phòng).",
            "Hệ thống điện tòa nhà sử dụng điện 1 pha / 3 pha ổn định có trang bị CB chống rò điện.",
            "Lối thoát nạn chính bố trí qua buồng thang bộ theo quy chuẩn TCVN 3890:2023."
        ],
        missing_info=[
            "Bản vẽ mặt bằng kiến trúc chi tiết (CAD / PDF) có thể hiện lối thoát nạn.",
            "Hồ sơ thẩm duyệt thiết kế PCCC gốc của công trình (nếu có)."
        ],
        confidence_level=conf
    )


def generate_smart_chat_response(message: str, history: list = None) -> ChatResponse:
    msg_lower = message.lower()
    
    # Extract numbers/keywords from message
    floors_match = re.search(r'(\d+)\s*tầng', msg_lower)
    area_match = re.search(r'(\d+)\s*(m2|m²|mét vuông)', msg_lower)
    floors = int(floors_match.group(1)) if floors_match else 2
    area = int(area_match.group(1)) if area_match else 100
    
    if any(k in msg_lower for k in ["nhà xưởng", "xưởng", "kho", "nhà kho"]):
        btype = "Nhà kho / Xưởng sản xuất"
    elif any(k in msg_lower for k in ["quán", "karaoke", "nhà hàng", "bán hàng", "cửa hàng", "shop"]):
        btype = "Cơ sở kinh doanh dịch vụ"
    elif any(k in msg_lower for k in ["chung cư", "căn hộ", "phòng trọ"]):
        btype = "Chung cư / Căn hộ"
    elif any(k in msg_lower for k in ["văn phòng", "công ty"]):
        btype = "Văn phòng làm việc"
    else:
        btype = "Nhà ở gia đình"

    if any(k in msg_lower for k in ["giá", "chi phí", "bao nhiêu tiền", "tiền", "giá cả"]):
        response_text = (
            f"Chào bạn! Đối với công trình loại hình {btype} ({floors} tầng, diện tích ~{area}m²), "
            f"chi phí trang bị PCCC phụ thuộc vào số lượng bình chữa cháy, đầu báo khói và hệ thống chuông báo.\n"
            f"Hệ thống ước tính chi phí thiết bị và thi công cơ bản khoảng từ 3.500.000đ đến 18.000.000đ tùy theo chuẩn TCVN 3890:2023.\n"
            f"Bạn có thể mở mục 'Dự toán báo giá AI' trên thanh điều hướng để xem chi tiết chi tiết từng thiết bị!"
        )
    elif any(k in msg_lower for k in ["tiêu chuẩn", "quy định", "tcvn", "luật", "pháp lý"]):
        response_text = (
            f"Theo quy chuẩn TCVN 3890:2023 về an toàn PCCC cho {btype}:\n"
            f"- Mật độ bình chữa cháy: Tối thiểu 2 bình bột ABC 4kg cho mỗi tầng (bán kính bảo vệ ≤ 20m).\n"
            f"- Cảnh báo cháy tự động: Bắt buộc trang bị đầu báo khói độc lập tại khu vực phòng ngủ, hành lang và đầu báo nhiệt tại gian bếp.\n"
            f"- Lối thoát nạn: Bố trí đèn EXIT và đèn sự cố chỉ dẫn thoát hiểm tại các vị trí cửa ra và thang bộ."
        )
    elif any(k in msg_lower for k in ["bảo trì", "hỏng", "sửa", "lỗi", "kiểm tra", "pin"]):
        response_text = (
            f"Việc kiểm tra bảo dưỡng hệ thống PCCC cho {btype} cần thực hiện định kỳ:\n"
            f"1. Bình chữa cháy: Kiểm tra kim đồng hồ áp suất hàng tháng (kim ở vạch xanh là đạt standards).\n"
            f"2. Đầu báo khói: Vệ sinh bụi khoang cảm biến và thay pin dự phòng định kỳ.\n"
            f"3. Bạn cũng có thể dùng tính năng 'Chẩn đoán sự cố AI' của FireGuard để kiểm tra tình trạng thiết bị!"
        )
    else:
        response_text = (
            f"Xin chào! Trợ lý FireGuard AI đã phân tích yêu cầu của bạn về công trình {btype} ({floors} tầng, diện tích ~{area}m²).\n"
            f"Dựa trên quy định PCCC, chúng tôi đề xuất phương án trang bị sơ bộ bao gồm bình chữa cháy bột ABC 4kg, bình khí CO2 tủ điện và đầu báo khói độc lập không dây.\n"
            f"Để nhận tư vấn chi tiết và bản vẽ thiết kế chính xác 100%, bạn có thể đăng ký dịch vụ khảo sát thực địa trực tiếp với chuyên gia PCCC của chúng tôi."
        )

    ext_abc_qty = max(2 * floors, int(area / 50))
    ext_co2_qty = max(1 * floors, 1)
    smoke_qty = max(2 * floors, int(area / 35))
    
    suggested_equipment = [
        {"item_code": "EXT-ABC-4KG", "quantity": ext_abc_qty},
        {"item_code": "EXT-CO2-3KG", "quantity": ext_co2_qty},
        {"item_code": "DET-SMOKE-WIRE", "quantity": smoke_qty},
        {"item_code": "DEN-EXIT", "quantity": max(2, floors)}
    ]

    followup_questions = [
        f"Công trình {btype} của bạn có sử dụng thiết bị nấu nướng hoặc bếp gas không?",
        "Nhà bạn có mấy lối thoát nạn chính và thang bộ rộng bao nhiêu?",
        "Bạn có muốn kết nối hệ thống báo cháy tự động gọi điện/nhắn tin khẩn cấp không?"
    ]

    preliminary_recommendations = [
        f"Bố trí tối thiểu {ext_abc_qty} bình chữa cháy bột ABC 4kg tại khu vực cầu thang các tầng.",
        f"Lắp đặt {smoke_qty} đầu báo khói quang độc lập tại các phòng và hành lang.",
        "Trang bị đèn chỉ dẫn EXIT lối thoát nạn có sạc điện dự phòng."
    ]

    return ChatResponse(
        response_text=response_text,
        followup_questions=followup_questions,
        preliminary_recommendations=preliminary_recommendations,
        suggested_equipment=[ChatbotEquipment(**e) for e in suggested_equipment],
        can_convert_to_survey=True
    )
