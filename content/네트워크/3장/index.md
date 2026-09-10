강의를 복기하며 작성한 글입니다.
틀린점이 있을 수 있습니다.

## WAN

- LAN을 상호 연결하여 다중 LAN의 집합체를 WAN이라고 한다.

## LAN CARD

- FRAME 이라는 단위로 표시하고 있다.
- 작은 네트워크 단위

## NIC

- NIC은 흔히 LAN 카드
- 유/무선 NIC이 있지만 필요할 때만 구분한다.
  - Ethernet
  - 802.11x
- NIC은 H/W이고 MAC주소를 가진다.
  - MAC 주소(48 bit)를 가지며 전세계에서 유일한 값으로 볼 수 있다.

## Ethernet Header

Destination MAC adress 48bit
Source MAC address 48bit
Type 16bit Data 16bit
Trailer (Frame Check Sequence , CRC) 32bit

이 덩어리 전체가 L2 Ethernet Header다
라고 가정하면 Payload 까지 합쳐 L2 Frame이다.

## L2 Access switch

- End-point와 직접 연결되는 스위치
- MAC 주소를 근거로 스위칭
- 내부에 MAC Table이 저장되어 있다.

## AWS 환경의 특수성

- L2 수준 네트워크는 노출되지 않고 설정도 불가.
- AWS VPC는 SDN으로 구현되어 있어 L2 개념은 추상화
  - MAC 주소 기반 통신이 없다.
  - 가상네트워크 패브릭을 통해 IP 기반 라우팅
- ARP 요청도 가상화 처리하며 브로드캐스트가 없다
- VLAN을 직접 구성할 수 없지만 서브넷과 보안 그룹 설정으로 대체
  - STP가 없다

ARP
STP
